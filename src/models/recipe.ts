export interface Recipe {
    id: string;
    title: string;
    ingredients: string[];
    macros: {
    protein: number;
    carbs: number;
    fat: number;
    };
    categoryId: string; // İlişkisel veri bağlantısı
    authorId: string;   // İlişkisel veri bağlantısı
}

export let recipes: Recipe[] = [
  {
    id: "1",
    title: "Yulaf Pancake",
    ingredients: ["Yulaf", "Yumurta", "Muz", "Süt"],
    macros: { protein: 20, carbs: 45, fat: 10 },
    categoryId: "cat-1",
    authorId: "user-101"
  }
];

