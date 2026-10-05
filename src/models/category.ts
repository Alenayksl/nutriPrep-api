export interface Category{
    id: string;
    name: string;
    description: string;
}

export type CategoryInput = Omit<Category, "id">;

export let categories: Category[] = [
{
    id: "1",
    name: "Breakfast",
    description: "Healthy recipes for an energetic start to the day"
},
{
    id: "2",
    name: "High Protein",
    description: "Protein-rich meals for post-workout recovery."
  }
];