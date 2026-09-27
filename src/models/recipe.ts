export interface Recipe {
    id: string;
    title: string;
    ingredients: string[];
    calories: number;
    protein: number;
}

export let recipes: Recipe[] = [
{
    id: "1",
    title: "Yulaf Pancake",
    ingredients: ["Yulaf", "Yumurta", "Muz", "Süt"],
    calories: 350,
    protein: 20
},
{
    id: "2",
    title: "Rye Lavaş Pizza",
    ingredients: ["Çavdar Lavaş", "Domates Sosu", "Kaşar Peyniri", "Zeytin"],
    calories: 400,
    protein: 15
  }
];