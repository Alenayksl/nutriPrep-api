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
  authorId: number;
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

