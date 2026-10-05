import { AppError } from "../errors/AppError";
import { MealPlan, mealPlans, MealPlanInput } from "../models/mealPlan";
import { recipes } from "../models/recipe";
import { users } from "../models/user";

const nextId = (): string => {
  const highestId = mealPlans.reduce((highest, plan) => Math.max(highest, Number(plan.id) || 0), 0);
  return (highestId + 1).toString();
};

const assertRelations = (input: MealPlanInput): void => {
  if (!users.some((user) => user.id === input.userId)) {
    throw new AppError(400, "The selected user does not exist.");
  }
  if (input.recipeIds.some((recipeId) => !recipes.some((recipe) => recipe.id === recipeId))) {
    throw new AppError(400, "A recipe in the meal plan does not exist.");
  }
};

export const getMealPlans = (): MealPlan[] => mealPlans;

export const getMealPlan = (id: string): MealPlan => {
  const plan = mealPlans.find((item) => item.id === id);
  if (!plan) throw new AppError(404, "Meal plan not found.");
  return plan;
};

export const createMealPlan = (input: MealPlanInput): MealPlan => {
  assertRelations(input);
  const plan: MealPlan = { id: nextId(), ...input };
  mealPlans.push(plan);
  return plan;
};

export const updateMealPlan = (id: string, input: MealPlanInput): MealPlan => {
  assertRelations(input);
  const plan = getMealPlan(id);
  Object.assign(plan, input);
  return plan;
};

export const deleteMealPlan = (id: string): void => {
  const index = mealPlans.findIndex((plan) => plan.id === id);
  if (index === -1) throw new AppError(404, "Meal plan not found.");
  mealPlans.splice(index, 1);
};