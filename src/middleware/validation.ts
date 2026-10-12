import { RequestHandler } from "express";
import { CategoryInput } from "../models/category";
import { MealPlanInput } from "../models/mealPlan";
import { RecipeInput } from "../models/recipe";
import { UserRegistrationInput, UserUpdateInput } from "../models/user";

type BodyValidator<T> = (body: unknown) => body is T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);

const isOptionalNonNegativeNumber = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isCategoryInput: BodyValidator<CategoryInput> = (body): body is CategoryInput =>
  isRecord(body) && isNonEmptyString(body.name);

const isRecipeInput: BodyValidator<RecipeInput> = (body): body is RecipeInput =>
  isRecord(body) &&
  isNonEmptyString(body.title) &&
  isStringArray(body.ingredients) &&
  isNonEmptyString(body.instructions) &&
  isPositiveInteger(body.categoryId) &&
  isPositiveInteger(body.authorId) &&
  isOptionalNonNegativeNumber(body.calories) &&
  isOptionalNonNegativeNumber(body.protein) &&
  isOptionalNonNegativeNumber(body.carbs) &&
  isOptionalNonNegativeNumber(body.fat) &&
  (body.description === undefined || isNonEmptyString(body.description)) &&
  (body.isPublic === undefined || typeof body.isPublic === "boolean");

const isMealPlanInput: BodyValidator<MealPlanInput> = (body): body is MealPlanInput =>
  isRecord(body) &&
  isPositiveInteger(body.userId) &&
  isPositiveInteger(body.recipeId) &&
  isNonEmptyString(body.dayOfWeek) &&
  isNonEmptyString(body.mealType);

const isUserRegistrationInput: BodyValidator<UserRegistrationInput> = (body): body is UserRegistrationInput =>
  isRecord(body) &&
  isNonEmptyString(body.username) &&
  isNonEmptyString(body.email) &&
  isNonEmptyString(body.password);

const isUserUpdateInput: BodyValidator<UserUpdateInput> = (body): body is UserUpdateInput => {
  if (!isRecord(body)) return false;

  const hasUserField = body.username !== undefined || body.email !== undefined || body.password !== undefined;
  return hasUserField &&
    (body.username === undefined || isNonEmptyString(body.username)) &&
    (body.email === undefined || isNonEmptyString(body.email)) &&
    (body.password === undefined || isNonEmptyString(body.password));
};

const validate = <T>(validator: BodyValidator<T>, message: string): RequestHandler =>
  (req, res, next) => {
    if (!validator(req.body)) {
      res.status(400).json({ success: false, message });
      return;
    }

    next();
  };

export const validateCategory = validate(isCategoryInput, "Category name is required.");
export const validateRecipe = validate(isRecipeInput, "Recipe fields must be valid and complete.");
export const validateMealPlan = validate(isMealPlanInput, "Meal plan fields must be valid and complete.");
export const validateUserRegistration = validate(isUserRegistrationInput, "Username, email, and password are required.");
export const validateUserUpdate = validate(isUserUpdateInput, "At least one valid user field is required.");