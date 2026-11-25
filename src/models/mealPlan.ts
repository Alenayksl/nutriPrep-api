// Listed in calendar order; this order is also used to sort plans.
export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
export type MealType = (typeof MEAL_TYPES)[number];

export const isDayOfWeek = (value: unknown): value is DayOfWeek =>
  typeof value === "string" && (DAYS_OF_WEEK as readonly string[]).includes(value);

export const isMealType = (value: unknown): value is MealType =>
  typeof value === "string" && (MEAL_TYPES as readonly string[]).includes(value);

export interface MealPlanInput {
  // Defaults to the caller; only an ADMIN may set it to another user.
  userId?: number;
  recipeId: number;
  dayOfWeek: string;
  mealType: string;
}

export interface MealPlanFilters {
  page: number;
  limit: number;
  userId?: number;
  dayOfWeek?: string;
  mealType?: string;
}

export interface MacroStatistics {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}