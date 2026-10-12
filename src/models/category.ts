export interface Category {
    id: number;
    name: string;
}

export type CategoryInput = Pick<Category, "name">;