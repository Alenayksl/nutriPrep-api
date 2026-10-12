import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { RecipeFilters, RecipeInput } from "../models/recipe";
import { prisma } from "../utils/prisma";

const parseId = (id: string): number => {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new AppError(400, "Recipe id must be a positive integer.");
  }
  return parsedId;
};

const recipeInclude = {
  category: true,
  author: {
    select: { id: true, email: true, name: true, role: true },
  },
} satisfies Prisma.RecipeInclude;

const buildWhere = (filters: RecipeFilters): Prisma.RecipeWhereInput => ({
  ...(filters.categoryId !== undefined && { categoryId: filters.categoryId }),
  ...(filters.minCalories !== undefined || filters.maxCalories !== undefined
    ? { calories: { gte: filters.minCalories, lte: filters.maxCalories } }
    : {}),
  ...(filters.minProtein !== undefined || filters.maxProtein !== undefined
    ? { protein: { gte: filters.minProtein, lte: filters.maxProtein } }
    : {}),
  ...(filters.minCarbs !== undefined || filters.maxCarbs !== undefined
    ? { carbs: { gte: filters.minCarbs, lte: filters.maxCarbs } }
    : {}),
  ...(filters.minFat !== undefined || filters.maxFat !== undefined
    ? { fat: { gte: filters.minFat, lte: filters.maxFat } }
    : {}),
});

const toCreateData = (input: RecipeInput): Prisma.RecipeCreateInput => ({
  title: input.title.trim(),
  description: input.description?.trim(),
  ingredients: input.ingredients,
  instructions: input.instructions.trim(),
  calories: input.calories,
  protein: input.protein,
  carbs: input.carbs,
  fat: input.fat,
  isPublic: input.isPublic ?? true,
  category: { connect: { id: input.categoryId } },
  author: { connect: { id: input.authorId } },
});

export class RecipeService {
  async getRecipes(filters: RecipeFilters) {
    const where = buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await prisma.$transaction([
      prisma.recipe.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
        include: recipeInclude,
      }),
      prisma.recipe.count({ where }),
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

  async getRecipe(id: string) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseId(id) },
      include: recipeInclude,
    });

    if (!recipe) throw new AppError(404, "Recipe not found.");
    return recipe;
  }

  async createRecipe(input: RecipeInput) {
    try {
      return await prisma.recipe.create({
        data: toCreateData(input),
        include: recipeInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new AppError(400, "The selected category or author does not exist.");
      }
      throw error;
    }
  }

  async updateRecipe(id: string, input: RecipeInput) {
    try {
      return await prisma.recipe.update({
        where: { id: parseId(id) },
        data: toCreateData(input),
        include: recipeInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Recipe not found.");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new AppError(400, "The selected category or author does not exist.");
      }
      throw error;
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    try {
      await prisma.recipe.delete({ where: { id: parseId(id) } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Recipe not found.");
      }
      throw error;
    }
  }
}

export const recipeService = new RecipeService();
