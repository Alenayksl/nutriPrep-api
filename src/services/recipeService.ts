import { AppError } from "../errors/AppError";
import { categories } from "../models/category";
import { Recipe, recipes, RecipeInput } from "../models/recipe";
import { users } from "../models/user";

const nextId = (): string => {
  const highestId = recipes.reduce((highest, recipe) => Math.max(highest, Number(recipe.id) || 0), 0);
  return (highestId + 1).toString();
};

const assertRelations = (input: RecipeInput): void => {
  if (!categories.some((category) => category.id === input.categoryId)) {
    throw new AppError(400, "The selected category does not exist.");
  }
  if (!users.some((user) => user.id === input.authorId)) {
    throw new AppError(400, "The selected user does not exist.");
  }
};

export const getRecipes = (): Recipe[] => recipes;

export const createRecipe = (input: RecipeInput): Recipe => {
  assertRelations(input);
  const recipe: Recipe = { id: nextId(), ...input };
  recipes.push(recipe);
  return recipe;
};

export const updateRecipe = (id: string, input: RecipeInput): Recipe => {
  assertRelations(input);
  const recipe = recipes.find((item) => item.id === id);
  if (!recipe) throw new AppError(404, "Recipe not found.");
  Object.assign(recipe, input);
  return recipe;
};

export const deleteRecipe = (id: string): void => {
  const index = recipes.findIndex((recipe) => recipe.id === id);
  if (index === -1) throw new AppError(404, "Recipe not found.");
  recipes.splice(index, 1);
};