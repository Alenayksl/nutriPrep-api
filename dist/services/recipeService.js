"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeService = exports.RecipeService = void 0;
const client_1 = require("@prisma/client");
const AppError_1 = require("../errors/AppError");
const prisma_1 = require("../utils/prisma");
const parseId = (id) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId < 1) {
        throw new AppError_1.AppError(400, "Recipe id must be a positive integer.");
    }
    return parsedId;
};
const recipeInclude = {
    category: true,
    author: {
        select: { id: true, email: true, name: true, role: true },
    },
};
const buildWhere = (filters) => ({
    ...(filters.categoryId !== undefined && { categoryId: filters.categoryId }),
    ...(filters.minCalories !== undefined || filters.maxCalories !== undefined
        ? { calories: { gte: filters.minCalories, lte: filters.maxCalories } }
        : {}),
    ...(filters.minProtein !== undefined || filters.maxProtein !== undefined
        ? { protein: { gte: filters.minProtein, lte: filters.maxProtein } }
        : {}),
    ...(filters.minCarbs !== undefined || filters.maxCarbs !== undefined
        ? { carbs: { gte: filters.minCarbs, lte: filters.maxCarbs } }
        : {}),
    ...(filters.minFat !== undefined || filters.maxFat !== undefined
        ? { fat: { gte: filters.minFat, lte: filters.maxFat } }
        : {}),
});
const toCreateData = (input) => ({
    title: input.title.trim(),
    description: input.description?.trim(),
    ingredients: input.ingredients,
    instructions: input.instructions.trim(),
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    isPublic: input.isPublic ?? true,
    category: { connect: { id: input.categoryId } },
    author: { connect: { id: input.authorId } },
});
class RecipeService {
    async getRecipes(filters) {
        const where = buildWhere(filters);
        const skip = (filters.page - 1) * filters.limit;
        const [data, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.recipe.findMany({
                where,
                skip,
                take: filters.limit,
                orderBy: { createdAt: "desc" },
                include: recipeInclude,
            }),
            prisma_1.prisma.recipe.count({ where }),
        ]);
        return {
            data,
            meta: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    }
    async getRecipe(id) {
        const recipe = await prisma_1.prisma.recipe.findUnique({
            where: { id: parseId(id) },
            include: recipeInclude,
        });
        if (!recipe)
            throw new AppError_1.AppError(404, "Recipe not found.");
        return recipe;
    }
    async createRecipe(input) {
        try {
            return await prisma_1.prisma.recipe.create({
                data: toCreateData(input),
                include: recipeInclude,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
                throw new AppError_1.AppError(400, "The selected category or author does not exist.");
            }
            throw error;
        }
    }
    async updateRecipe(id, input) {
        try {
            return await prisma_1.prisma.recipe.update({
                where: { id: parseId(id) },
                data: toCreateData(input),
                include: recipeInclude,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new AppError_1.AppError(404, "Recipe not found.");
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
                throw new AppError_1.AppError(400, "The selected category or author does not exist.");
            }
            throw error;
        }
    }
    async deleteRecipe(id) {
        try {
            await prisma_1.prisma.recipe.delete({ where: { id: parseId(id) } });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new AppError_1.AppError(404, "Recipe not found.");
            }
            throw error;
        }
    }
}
exports.RecipeService = RecipeService;
exports.recipeService = new RecipeService();
