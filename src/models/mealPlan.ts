export interface MealPlanInput {
  userId: number;
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