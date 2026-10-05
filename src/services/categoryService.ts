import { AppError } from "../errors/AppError";
import { categories, Category, CategoryInput } from "../models/category";

const nextId = (): string => {
  const highestId = categories.reduce((highest, category) => Math.max(highest, Number(category.id) || 0), 0);
  return (highestId + 1).toString();
};

export const getCategories = (): Category[] => categories;

export const getCategory = (id: string): Category => {
  const category = categories.find((item) => item.id === id);
  if (!category) throw new AppError(404, "Category not found.");
  return category;
};

export const createCategory = (input: CategoryInput): Category => {
  const category: Category = { id: nextId(), ...input };
  categories.push(category);
  return category;
};

export const updateCategory = (id: string, input: CategoryInput): Category => {
  const category = getCategory(id);
  Object.assign(category, input);
  return category;
};

export const deleteCategory = (id: string): void => {
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) throw new AppError(404, "Category not found.");
  categories.splice(index, 1);
};