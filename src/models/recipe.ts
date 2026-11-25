export interface RecipeInput {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  isPublic?: boolean;
  categoryId: number;
  // Defaults to the caller; only an ADMIN may set it to another user.
  authorId?: number;
}

export interface RecipeFilters {
  page: number;
  limit: number;
  categoryId?: number;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minFat?: number;
  maxFat?: number;
}

export type NutritionFilters = Omit<RecipeFilters, "page" | "limit" | "categoryId">;

// Named nutrition filters; computed from stored macros, so they never go out of sync.
export const RECIPE_PRESETS = {
  "high-protein": { description: "Protein of at least 25 g", filters: { minProtein: 25 } },
  "high-carb": { description: "Carbs of at least 50 g", filters: { minCarbs: 50 } },
  "low-calorie": { description: "At most 400 calories", filters: { maxCalories: 400 } },
  "low-fat": { description: "Fat of at most 10 g", filters: { maxFat: 10 } },
} satisfies Record<string, { description: string; filters: NutritionFilters }>;

export type RecipePreset = keyof typeof RECIPE_PRESETS;

