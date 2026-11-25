import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { Actor, assertCanAccessOwnedBy, canAccessOwnedBy, isAdmin } from "../middleware/authorization";
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

// Anonymous callers see public recipes; members also see their own private ones; ADMIN sees all.
const visibleTo = (actor?: Actor): Prisma.RecipeWhereInput => {
  if (!actor) return { isPublic: true };
  if (isAdmin(actor)) return {};
  return { OR: [{ isPublic: true }, { authorId: actor.id }] };
};

export const isRecipeVisibleTo = (recipe: { isPublic: boolean; authorId: number }, actor?: Actor): boolean =>
  recipe.isPublic || (actor !== undefined && canAccessOwnedBy(actor, recipe.authorId));

// Members always author as themselves; only an ADMIN may attribute a recipe to someone else.
const resolveAuthorId = (input: RecipeInput, actor: Actor, fallbackAuthorId = actor.id): number => {
  const authorId = input.authorId ?? fallbackAuthorId;
  if (authorId !== actor.id && !isAdmin(actor)) {
    throw new AppError(403, "You can only create or edit recipes as yourself.");
  }
  return authorId;
};

// Prisma reports a missing connect target as P2025, which looks like "recipe not found", so check up front.
const assertReferencesExist = async (input: RecipeInput, authorId: number): Promise<void> => {
  const [category, author] = await Promise.all([
    prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: authorId }, select: { id: true } }),
  ]);
  if (!category) throw new AppError(400, `Category ${input.categoryId} does not exist.`);
  if (!author) throw new AppError(400, `Author (user) ${authorId} does not exist.`);
};

const toCreateData = (input: RecipeInput, authorId: number): Prisma.RecipeCreateInput => ({
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
  author: { connect: { id: authorId } },
});

export class RecipeService {
  async getRecipes(filters: RecipeFilters, actor?: Actor) {
    const where: Prisma.RecipeWhereInput = { AND: [buildWhere(filters), visibleTo(actor)] };
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

  // Private recipes of other users answer 404, so their existence is not revealed.
  async getRecipe(id: string, actor?: Actor) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseId(id) },
      include: recipeInclude,
    });

    if (!recipe || !isRecipeVisibleTo(recipe, actor)) throw new AppError(404, "Recipe not found.");
    return recipe;
  }

  // Loads a recipe for a write, allowing only its author or an ADMIN.
  private async getOwnedRecipe(recipeId: number, actor: Actor) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, authorId: true, isPublic: true },
    });
    if (!recipe || !isRecipeVisibleTo(recipe, actor)) throw new AppError(404, "Recipe not found.");
    assertCanAccessOwnedBy(actor, recipe.authorId, "You can only modify recipes you authored.");
    return recipe;
  }

  async createRecipe(input: RecipeInput, actor: Actor) {
    const authorId = resolveAuthorId(input, actor);
    await assertReferencesExist(input, authorId);
    try {
      return await prisma.recipe.create({
        data: toCreateData(input, authorId),
        include: recipeInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new AppError(400, "The selected category or author does not exist.");
      }
      throw error;
    }
  }

  async updateRecipe(id: string, input: RecipeInput, actor: Actor) {
    const existing = await this.getOwnedRecipe(parseId(id), actor);
    // Omitting authorId keeps the current author (so an ADMIN edit does not take over the recipe).
    const authorId = resolveAuthorId(input, actor, existing.authorId);
    await assertReferencesExist(input, authorId);
    try {
      return await prisma.recipe.update({
        where: { id: existing.id },
        data: toCreateData(input, authorId),
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

  async deleteRecipe(id: string, actor: Actor): Promise<void> {
    const existing = await this.getOwnedRecipe(parseId(id), actor);
    try {
      await prisma.recipe.delete({ where: { id: existing.id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Recipe not found.");
      }
      throw error;
    }
  }
}

export const recipeService = new RecipeService();
