"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = exports.CategoryService = void 0;
const client_1 = require("@prisma/client");
const AppError_1 = require("../errors/AppError");
const prisma_1 = require("../utils/prisma");
const parseCategoryId = (id) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId < 1) {
        throw new AppError_1.AppError(400, "Category id must be a positive integer.");
    }
    return parsedId;
};
class CategoryService {
    async getCategories() {
        return prisma_1.prisma.category.findMany({ orderBy: { name: "asc" } });
    }
    async getCategory(id) {
        const category = await prisma_1.prisma.category.findUnique({
            where: { id: parseCategoryId(id) },
        });
        if (!category)
            throw new AppError_1.AppError(404, "Category not found.");
        return category;
    }
    async createCategory(input) {
        try {
            return await prisma_1.prisma.category.create({
                data: { name: input.name.trim() },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new AppError_1.AppError(409, "A category with this name already exists.");
            }
            throw error;
        }
    }
    async updateCategory(id, input) {
        try {
            return await prisma_1.prisma.category.update({
                where: { id: parseCategoryId(id) },
                data: { name: input.name.trim() },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new AppError_1.AppError(409, "A category with this name already exists.");
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new AppError_1.AppError(404, "Category not found.");
            }
            throw error;
        }
    }
    async deleteCategory(id) {
        try {
            await prisma_1.prisma.category.delete({ where: { id: parseCategoryId(id) } });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new AppError_1.AppError(404, "Category not found.");
            }
            throw error;
        }
    }
}
exports.CategoryService = CategoryService;
exports.categoryService = new CategoryService();
