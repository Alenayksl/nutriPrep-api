import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { MealPlanFilters, MealPlanInput, MacroStatistics } from "../models/mealPlan";
import { prisma } from "../utils/prisma";

const parseId = (id: string, resource: string): number => {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new AppError(400, `${resource} id must be a positive integer.`);
  }
  return parsedId;
};

const mealPlanInclude = {
  recipe: {
    include: { category: true },
  },
  user: {
    select: { id: true, email: true, name: true, role: true },
  },
} satisfies Prisma.MealPlanInclude;

const buildWhere = (filters: MealPlanFilters): Prisma.MealPlanWhereInput => ({
  ...(filters.userId !== undefined && { userId: filters.userId }),
  ...(filters.dayOfWeek !== undefined && { dayOfWeek: filters.dayOfWeek }),
  ...(filters.mealType !== undefined && { mealType: filters.mealType }),
});

const toMacroStatistics = (
  plans: Array<{ recipe: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null } }>,
): MacroStatistics =>
  plans.reduce(
    (totals, plan) => ({
      calories: totals.calories + (plan.recipe.calories ?? 0),
      protein: totals.protein + (plan.recipe.protein ?? 0),
      carbs: totals.carbs + (plan.recipe.carbs ?? 0),
      fat: totals.fat + (plan.recipe.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

// Prisma reports a missing connect target as P2025, which looks like "meal plan not found", so check up front.
const assertReferencesExist = async (input: MealPlanInput): Promise<void> => {
  const [user, recipe] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } }),
    prisma.recipe.findUnique({ where: { id: input.recipeId }, select: { id: true } }),
  ]);
  if (!user) throw new AppError(400, `User ${input.userId} does not exist.`);
  if (!recipe) throw new AppError(400, `Recipe ${input.recipeId} does not exist.`);
};

export class MealPlanService {
  async getMealPlans(filters: MealPlanFilters) {
    const where = buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await prisma.$transaction([
      prisma.mealPlan.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
        include: mealPlanInclude,
      }),
      prisma.mealPlan.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getMealPlan(id: string) {
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: parseId(id, "Meal plan") },
      include: mealPlanInclude,
    });

    if (!mealPlan) throw new AppError(404, "Meal plan not found.");
    return mealPlan;
  }

  async getActivePlan(userId: string) {
    const numericUserId = parseId(userId, "User");
    const plans = await prisma.mealPlan.findMany({
      where: { userId: numericUserId },
      orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
      include: mealPlanInclude,
    });

    return {
      plans,
      totalMacroStatistics: toMacroStatistics(plans),
    };
  }

  async createMealPlan(input: MealPlanInput) {
    await assertReferencesExist(input);
    try {
      return await prisma.mealPlan.create({
        data: {
          user: { connect: { id: input.userId } },
          recipe: { connect: { id: input.recipeId } },
          dayOfWeek: input.dayOfWeek.trim(),
          mealType: input.mealType.trim(),
        },
        include: mealPlanInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new AppError(400, "The selected user or recipe does not exist.");
      }
      throw error;
    }
  }

  async updateMealPlan(id: string, input: MealPlanInput) {
    const mealPlanId = parseId(id, "Meal plan");
    await assertReferencesExist(input);
    try {
      return await prisma.mealPlan.update({
        where: { id: mealPlanId },
        data: {
          user: { connect: { id: input.userId } },
          recipe: { connect: { id: input.recipeId } },
          dayOfWeek: input.dayOfWeek.trim(),
          mealType: input.mealType.trim(),
        },
        include: mealPlanInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Meal plan not found.");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new AppError(400, "The selected user or recipe does not exist.");
      }
      throw error;
    }
  }

  async deleteMealPlan(id: string): Promise<void> {
    try {
      await prisma.mealPlan.delete({ where: { id: parseId(id, "Meal plan") } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Meal plan not found.");
      }
      throw error;
    }
  }
}

export const mealPlanService = new MealPlanService();