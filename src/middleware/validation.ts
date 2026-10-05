import { RequestHandler } from "express";
import { CategoryInput } from "../models/category";
import { MealPlanInput } from "../models/mealPlan";
import { RecipeInput } from "../models/recipe";
import { UserRegistrationInput } from "../models/user";

type BodyValidator<T> = (body: unknown) => body is T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);

const isMacros = (value: unknown): value is RecipeInput["macros"] => {
  if (!isRecord(value)) return false;

  return ["protein", "carbs", "fat"].every((key) => {
    const macro = value[key];
    return typeof macro === "number" && Number.isFinite(macro) && macro >= 0;
  });
};

const isCategoryInput: BodyValidator<CategoryInput> = (body): body is CategoryInput =>
  isRecord(body) && isNonEmptyString(body.name) && isNonEmptyString(body.description);

const isRecipeInput: BodyValidator<RecipeInput> = (body): body is RecipeInput =>
  isRecord(body) &&
  isNonEmptyString(body.title) &&
  isStringArray(body.ingredients) &&
  isMacros(body.macros) &&
  isNonEmptyString(body.categoryId) &&
  isNonEmptyString(body.authorId);

const isMealPlanInput: BodyValidator<MealPlanInput> = (body): body is MealPlanInput =>
  isRecord(body) &&
  isNonEmptyString(body.userId) &&
  isNonEmptyString(body.title) &&
  isStringArray(body.recipeIds);

const isUserRegistrationInput: BodyValidator<UserRegistrationInput> = (body): body is UserRegistrationInput =>
  isRecord(body) &&
  isNonEmptyString(body.username) &&
  isNonEmptyString(body.email) &&
  isNonEmptyString(body.password);

const validate = <T>(validator: BodyValidator<T>, message: string): RequestHandler =>
  (req, res, next) => {
    if (!validator(req.body)) {
      res.status(400).json({ success: false, message });
      return;
    }

    next();
  };

export const validateCategory = validate(isCategoryInput, "Category name and description are required.");
export const validateRecipe = validate(isRecipeInput, "Recipe fields must be valid and complete.");
export const validateMealPlan = validate(isMealPlanInput, "Meal plan fields must be valid and complete.");
export const validateUserRegistration = validate(isUserRegistrationInput, "Username, email, and password are required.");