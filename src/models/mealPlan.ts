export interface MealPlan {
    id: string;
    userId: string;
    title: string;
    recipeIds: string[];
}

export let mealPlans: MealPlan[] = [
{
    id: "1",
    userId: "user-101", 
    title: "Yüksek Proteinli Hafta",
    recipeIds: ["1", "3"] // Yulaf Pancake ve Chia Bowl'u içeriyor
}
];