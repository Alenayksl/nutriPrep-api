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
    select: { id: true, name: true },
  },
  _count: { select: { mealPlans: true } },
} satisfies Prisma.RecipeInclude;

type RecipeWithRelations = Prisma.RecipeGetPayload<{ include: typeof recipeInclude }>;

const toRecipeResponse = ({ _count, author, ...recipe }: RecipeWithRelations) => ({
  ...recipe,
  author: { id: author.id, username: author.name },
  savedCount: _count.mealPlans,
});

const buildWhere = (filters: RecipeFilters): Prisma.RecipeWhereInput => ({
  ...(filters.categoryId !== undefined && { categoryId: filters.categoryId }),
  ...(filters.system !== undefined && { isSystem: filters.system }),
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

const visibleTo = (actor?: Actor): Prisma.RecipeWhereInput => {
  if (!actor) return { isPublic: true };
  if (isAdmin(actor)) return {};
  return { OR: [{ isPublic: true }, { authorId: actor.id }] };
};

export const isRecipeVisibleTo = (recipe: { isPublic: boolean; authorId: number }, actor?: Actor): boolean =>
  recipe.isPublic || (actor !== undefined && canAccessOwnedBy(actor, recipe.authorId));

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

const resolveVisibility = (input: RecipeInput, actor: Actor, currentIsSystem = false) => {
  const isSystem = input.isSystem ?? currentIsSystem;
  if (isSystem !== currentIsSystem && !isAdmin(actor)) {
    throw new AppError(403, "Only an ADMIN can mark or unmark system recipes.");
  }
  if (isSystem && input.isPublic === false) throw new AppError(400, "System recipes must be public.");
  return { isSystem, isPublic: isSystem || (input.isPublic ?? true) };
};

type Visibility = ReturnType<typeof resolveVisibility>;

const toCreateData = (input: RecipeInput, authorId: number, visibility: Visibility): Prisma.RecipeCreateInput => ({
  title: input.title.trim(),
  description: input.description?.trim(),
  ingredients: input.ingredients,
  instructions: input.instructions.trim(),
  calories: input.calories,
  protein: input.protein,
  carbs: input.carbs,
  fat: input.fat,
  isPublic: visibility.isPublic,
  isSystem: visibility.isSystem,
  category: { connect: { id: input.categoryId } },
  author: { connect: { id: authorId } },
});

export class RecipeService {
  async getRecipes(filters: RecipeFilters, actor?: Actor, publicOnly = false) {
    const visibility = publicOnly ? visibleTo(undefined) : visibleTo(actor);
    const where: Prisma.RecipeWhereInput = { AND: [buildWhere(filters), visibility] };
    const skip = (filters.page - 1) * filters.limit;

    const orderBy: Prisma.RecipeOrderByWithRelationInput[] =
      filters.sort === "popular"
        ? [{ mealPlans: { _count: "desc" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

    const [data, total] = await prisma.$transaction([
      prisma.recipe.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy,
        include: recipeInclude,
      }),
      prisma.recipe.count({ where }),
    ]);

    return {
      data: data.map(toRecipeResponse),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getRecipe(id: string, actor?: Actor) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseId(id) },
      include: recipeInclude,
    });

    if (!recipe || !isRecipeVisibleTo(recipe, actor)) throw new AppError(404, "Recipe not found.");
    return toRecipeResponse(recipe);
  }

  private async getOwnedRecipe(recipeId: number, actor: Actor) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, authorId: true, isPublic: true, isSystem: true },
    });
    if (!recipe || !isRecipeVisibleTo(recipe, actor)) throw new AppError(404, "Recipe not found.");
    assertCanAccessOwnedBy(actor, recipe.authorId, "You can only modify recipes you authored.");
    return recipe;
  }

  async createRecipe(input: RecipeInput, actor: Actor) {
    const authorId = resolveAuthorId(input, actor);
    const visibility = resolveVisibility(input, actor);
    await assertReferencesExist(input, authorId);
    try {
      const recipe = await prisma.recipe.create({
        data: toCreateData(input, authorId, visibility),
        include: recipeInclude,
      });
      return toRecipeResponse(recipe);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new AppError(400, "The selected category or author does not exist.");
      }
      throw error;
    }
  }

  async updateRecipe(id: string, input: RecipeInput, actor: Actor) {
    const existing = await this.getOwnedRecipe(parseId(id), actor);
    const authorId = resolveAuthorId(input, actor, existing.authorId);
    const visibility = resolveVisibility(input, actor, existing.isSystem);
    await assertReferencesExist(input, authorId);
    try {
      const recipe = await prisma.recipe.update({
        where: { id: existing.id },
        data: toCreateData(input, authorId, visibility),
        include: recipeInclude,
      });
      return toRecipeResponse(recipe);
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

  async setRecipeVisibility(id: string, isPublic: boolean, actor: Actor) {
    const existing = await this.getOwnedRecipe(parseId(id), actor);
    if (existing.isSystem && !isPublic) throw new AppError(400, "System recipes must be public.");

    const recipe = await prisma.recipe.update({
      where: { id: existing.id },
      data: { isPublic },
      include: recipeInclude,
    });
    return toRecipeResponse(recipe);
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
