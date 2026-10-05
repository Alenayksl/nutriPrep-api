export interface MealPlan {
    id: string;
    userId: string;
    title: string;
    recipeIds: string[];
}

export type MealPlanInput = Omit<MealPlan, "id">;

export let mealPlans: MealPlan[] = [
{
    id: "1",
    userId: "user-101", 
    title: "High Protein Week",
    recipeIds: ["1"]
}
];