export interface Recipe {
    id: string;
    title: string;
    ingredients: string[];
    macros: {
    protein: number;
    carbs: number;
    fat: number;
    };
    categoryId: string; // Category relation.
    authorId: string;   // Author relation.
}

export type RecipeInput = Omit<Recipe, "id">;

export let recipes: Recipe[] = [
  {
    id: "1",
    title: "Oat Pancake",
    ingredients: ["Oats", "Egg", "Banana", "Milk"],
    macros: { protein: 20, carbs: 45, fat: 10 },
    categoryId: "1",
    authorId: "user-101"
  }
];

