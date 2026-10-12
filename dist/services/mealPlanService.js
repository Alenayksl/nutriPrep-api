"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealPlanService = exports.MealPlanService = void 0;
const client_1 = require("@prisma/client");
const AppError_1 = require("../errors/AppError");
const prisma_1 = require("../utils/prisma");
const parseId = (id, resource) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId < 1) {
        throw new AppError_1.AppError(400, `${resource} id must be a positive integer.`);
    }
    return parsedId;
};
const mealPlanInclude = {
    recipe: {
        include: { category: true },
    },
    user: {
        select: { id: true, email: true, name: true, role: true },
    },
};
const buildWhere = (filters) => ({
    ...(filters.userId !== undefined && { userId: filters.userId }),
    ...(filters.dayOfWeek !== undefined && { dayOfWeek: filters.dayOfWeek }),
    ...(filters.mealType !== undefined && { mealType: filters.mealType }),
});
const toMacroStatistics = (plans) => plans.reduce((totals, plan) => ({
    calories: totals.calories + (plan.recipe.calories ?? 0),
    protein: totals.protein + (plan.recipe.protein ?? 0),
    carbs: totals.carbs + (plan.recipe.carbs ?? 0),
    fat: totals.fat + (plan.recipe.fat ?? 0),
}), { calories: 0, protein: 0, carbs: 0, fat: 0 });
class MealPlanService {
    async getMealPlans(filters) {
        const where = buildWhere(filters);
        const skip = (filters.page - 1) * filters.limit;
        const [data, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.mealPlan.findMany({
                where,
                skip,
                take: filters.limit,
                orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
                include: mealPlanInclude,
            }),
            prisma_1.prisma.mealPlan.count({ where }),
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
    async getMealPlan(id) {
        const mealPlan = await prisma_1.prisma.mealPlan.findUnique({
            where: { id: parseId(id, "Meal plan") },
            include: mealPlanInclude,
        });
        if (!mealPlan)
            throw new AppError_1.AppError(404, "Meal plan not found.");
        return mealPlan;
    }
    async getActivePlan(userId) {
        const numericUserId = parseId(userId, "User");
        const plans = await prisma_1.prisma.mealPlan.findMany({
            where: { userId: numericUserId },
            orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
            include: mealPlanInclude,
        });
        return {
            plans,
            totalMacroStatistics: toMacroStatistics(plans),
        };
    }
    async createMealPlan(input) {
        try {
            return await prisma_1.prisma.mealPlan.create({
                data: {
                    user: { connect: { id: input.userId } },
                    recipe: { connect: { id: input.recipeId } },
                    dayOfWeek: input.dayOfWeek.trim(),
                    mealType: input.mealType.trim(),
                },
                include: mealPlanInclude,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
                throw new AppError_1.AppError(400, "The selected user or recipe does not exist.");
            }
            throw error;
        }
    }
    async updateMealPlan(id, input) {
        try {
            return await prisma_1.prisma.mealPlan.update({
                where: { id: parseId(id, "Meal plan") },
                data: {
                    user: { connect: { id: input.userId } },
                    recipe: { connect: { id: input.recipeId } },
                    dayOfWeek: input.dayOfWeek.trim(),
                    mealType: input.mealType.trim(),
                },
                include: mealPlanInclude,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new AppError_1.AppError(404, "Meal plan not found.");
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
                throw new AppError_1.AppError(400, "The selected user or recipe does not exist.");
            }
            throw error;
        }
    }
    async deleteMealPlan(id) {
        try {
            await prisma_1.prisma.mealPlan.delete({ where: { id: parseId(id, "Meal plan") } });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new AppError_1.AppError(404, "Meal plan not found.");
            }
            throw error;
        }
    }
}
exports.MealPlanService = MealPlanService;
exports.mealPlanService = new MealPlanService();
