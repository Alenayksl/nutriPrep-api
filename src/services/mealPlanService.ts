import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { DAYS_OF_WEEK, DayOfWeek, MEAL_TYPES, MealPlanFilters, MealPlanInput, MacroStatistics, MealType } from "../models/mealPlan";
import { Actor, assertCanAccessOwnedBy, isAdmin } from "../middleware/authorization";
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

const publicSlotInclude = {
  recipe: {
    include: { category: true },
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

// dayOfWeek and mealType are stored as strings, so the database would sort them alphabetically
// (Friday before Monday, Dinner before Lunch); sort by calendar and meal order instead.
const compareSlots = (
  a: { userId: number; dayOfWeek: string; mealType: string },
  b: { userId: number; dayOfWeek: string; mealType: string },
): number =>
  a.userId - b.userId ||
  DAYS_OF_WEEK.indexOf(a.dayOfWeek as DayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek as DayOfWeek) ||
  MEAL_TYPES.indexOf(a.mealType as MealType) - MEAL_TYPES.indexOf(b.mealType as MealType);

type Slot = {
  dayOfWeek: string;
  mealType: string;
  recipe: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null };
};

// Every day of the week with a Breakfast/Lunch/Dinner slot each (null when nothing is planned).
const buildWeek = <T extends Slot>(plans: T[]) =>
  DAYS_OF_WEEK.map((dayOfWeek) => {
    const dayPlans = plans.filter((plan) => plan.dayOfWeek === dayOfWeek);
    const meals = Object.fromEntries(
      MEAL_TYPES.map((mealType) => [mealType, dayPlans.find((plan) => plan.mealType === mealType) ?? null]),
    ) as Record<MealType, T | null>;

    return { dayOfWeek, meals, totals: toMacroStatistics(dayPlans) };
  });

const publicSlotsWhere = (userIds: number[]): Prisma.MealPlanWhereInput => ({
  userId: { in: userIds },
  recipe: { isPublic: true },
});

const toPublicPlan = (
  owner: { id: number; name: string | null; mealPlanSharedAt: Date | null },
  slots: Prisma.MealPlanGetPayload<{ include: typeof publicSlotInclude }>[],
) => ({
  owner: { id: owner.id, username: owner.name },
  sharedAt: owner.mealPlanSharedAt,
  mealCount: slots.length,
  days: buildWeek(slots),
  weekTotals: toMacroStatistics(slots),
});

const toSlotConflict = (error: unknown, input: MealPlanInput, userId: number): unknown =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    ? new AppError(409, `User ${userId} already has ${input.mealType} planned for ${input.dayOfWeek}. Update that entry instead.`)
    : error;

const OWN_PLANS_ONLY = "You can only access your own meal plans.";

const resolveUserId = (input: MealPlanInput, actor: Actor, fallbackUserId = actor.id): number => {
  const userId = input.userId ?? fallbackUserId;
  assertCanAccessOwnedBy(actor, userId, OWN_PLANS_ONLY);
  return userId;
};

// Prisma reports a missing connect target as P2025, which looks like "meal plan not found", so check up front.
const assertReferencesExist = async (userId: number, recipeId: number): Promise<void> => {
  const [user, recipe] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true, isPublic: true, authorId: true } }),
  ]);
  if (!user) throw new AppError(400, `User ${userId} does not exist.`);
  if (!recipe || (!recipe.isPublic && recipe.authorId !== userId)) {
    throw new AppError(400, `Recipe ${recipeId} does not exist.`);
  }
};

export class MealPlanService {
  async getMealPlans(filters: MealPlanFilters, actor: Actor) {
    if (!isAdmin(actor)) {
      if (filters.userId !== undefined) assertCanAccessOwnedBy(actor, filters.userId, OWN_PLANS_ONLY);
      filters = { ...filters, userId: actor.id };
    }

    // A user's plan has at most 21 slots, so sorting in memory before paginating stays cheap.
    const plans = await prisma.mealPlan.findMany({ where: buildWhere(filters), include: mealPlanInclude });
    plans.sort(compareSlots);

    const total = plans.length;
    const skip = (filters.page - 1) * filters.limit;

    return {
      data: plans.slice(skip, skip + filters.limit),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getMealPlan(id: string, actor: Actor) {
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: parseId(id, "Meal plan") },
      include: mealPlanInclude,
    });

    if (!mealPlan) throw new AppError(404, "Meal plan not found.");
    assertCanAccessOwnedBy(actor, mealPlan.userId, OWN_PLANS_ONLY);
    return mealPlan;
  }

  private async getOwnedMealPlan(mealPlanId: number, actor: Actor) {
    const mealPlan = await prisma.mealPlan.findUnique({ where: { id: mealPlanId }, select: { id: true, userId: true } });
    if (!mealPlan) throw new AppError(404, "Meal plan not found.");
    assertCanAccessOwnedBy(actor, mealPlan.userId, OWN_PLANS_ONLY);
    return mealPlan;
  }

  async getActivePlan(userId: string) {
    const numericUserId = parseId(userId, "User");
    const plans = await prisma.mealPlan.findMany({
      where: { userId: numericUserId },
      include: mealPlanInclude,
    });
    plans.sort(compareSlots);

    return {
      plans,
      totalMacroStatistics: toMacroStatistics(plans),
    };
  }

  async getWeeklyPlan(userId: string) {
    const numericUserId = parseId(userId, "User");
    const user = await prisma.user.findUnique({ where: { id: numericUserId }, select: { mealPlanSharedAt: true } });
    if (!user) throw new AppError(404, "User not found.");

    const { plans, totalMacroStatistics } = await this.getActivePlan(userId);
    return {
      userId: numericUserId,
      isPublic: user.mealPlanSharedAt !== null,
      days: buildWeek(plans),
      weekTotals: totalMacroStatistics,
    };
  }

  async setPlanVisibility(userId: string, isPublic: boolean) {
    const numericUserId = parseId(userId, "User");
    const user = await prisma.user.findUnique({ where: { id: numericUserId }, select: { mealPlanSharedAt: true } });
    if (!user) throw new AppError(404, "User not found.");

    const sharedAt = isPublic ? (user.mealPlanSharedAt ?? new Date()) : null;
    await prisma.user.update({ where: { id: numericUserId }, data: { mealPlanSharedAt: sharedAt } });
    return { userId: numericUserId, isPublic, sharedAt };
  }

  async getPublicPlans(page: number, limit: number) {
    const where: Prisma.UserWhereInput = {
      mealPlanSharedAt: { not: null },
      mealPlans: { some: { recipe: { isPublic: true } } },
    };
    const [owners, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, mealPlanSharedAt: true },
        orderBy: [{ mealPlanSharedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const slots = await prisma.mealPlan.findMany({
      where: publicSlotsWhere(owners.map((owner) => owner.id)),
      include: publicSlotInclude,
    });
    slots.sort(compareSlots);

    return {
      data: owners.map((owner) => toPublicPlan(owner, slots.filter((slot) => slot.userId === owner.id))),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublicPlan(userId: string) {
    const numericUserId = parseId(userId, "User");
    const owner = await prisma.user.findUnique({
      where: { id: numericUserId },
      select: { id: true, name: true, mealPlanSharedAt: true },
    });
    if (!owner || owner.mealPlanSharedAt === null) throw new AppError(404, "Public meal plan not found.");

    const slots = await prisma.mealPlan.findMany({ where: publicSlotsWhere([owner.id]), include: publicSlotInclude });
    slots.sort(compareSlots);
    return toPublicPlan(owner, slots);
  }

  async createMealPlan(input: MealPlanInput, actor: Actor) {
    const userId = resolveUserId(input, actor);
    await assertReferencesExist(userId, input.recipeId);
    try {
      return await prisma.mealPlan.create({
        data: {
          user: { connect: { id: userId } },
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
      throw toSlotConflict(error, input, userId);
    }
  }

  async updateMealPlan(id: string, input: MealPlanInput, actor: Actor) {
    const existing = await this.getOwnedMealPlan(parseId(id, "Meal plan"), actor);
    const userId = resolveUserId(input, actor, existing.userId);
    await assertReferencesExist(userId, input.recipeId);
    try {
      return await prisma.mealPlan.update({
        where: { id: existing.id },
        data: {
          user: { connect: { id: userId } },
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
      throw toSlotConflict(error, input, userId);
    }
  }

  async deleteMealPlan(id: string, actor: Actor): Promise<void> {
    const existing = await this.getOwnedMealPlan(parseId(id, "Meal plan"), actor);
    try {
      await prisma.mealPlan.delete({ where: { id: existing.id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Meal plan not found.");
      }
      throw error;
    }
  }
}

export const mealPlanService = new MealPlanService();