import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { prisma } from "../utils/prisma";
import { CategoryInput } from "../models/category";

const parseCategoryId = (id: string): number => {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new AppError(400, "Category id must be a positive integer.");
  }
  return parsedId;
};

export class CategoryService {
  async getCategories() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async getCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id: parseCategoryId(id) },
    });

    if (!category) throw new AppError(404, "Category not found.");
    return category;
  }

  async createCategory(input: CategoryInput) {
    try {
      return await prisma.category.create({
        data: { name: input.name.trim(),
                description: input.description?.trim(),
         },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "A category with this name already exists.");
      }
      throw error;
    }
  }

  async updateCategory(id: string, input: CategoryInput) {
    try {
      return await prisma.category.update({
        where: { id: parseCategoryId(id) },
        data: { name: input.name.trim() },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "A category with this name already exists.");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Category not found.");
      }
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await prisma.category.delete({ where: { id: parseCategoryId(id) } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Category not found.");
      }
      throw error;
    }
  }
}

export const categoryService = new CategoryService();