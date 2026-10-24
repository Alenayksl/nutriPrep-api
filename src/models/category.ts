export interface Category {
    id: number;
    name: string;
    description?: string;
}

export type CategoryInput = Pick<Category, "name" | "description">;