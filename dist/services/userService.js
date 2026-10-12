"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const AppError_1 = require("../errors/AppError");
const mealPlanService_1 = require("./mealPlanService");
const prisma_1 = require("../utils/prisma");
const SALT_ROUNDS = 12;
const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};
const parseUserId = (id) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId < 1) {
        throw new AppError_1.AppError(400, "User id must be a positive integer.");
    }
    return parsedId;
};
const toPublicUser = (user) => ({
    id: user.id,
    username: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
class UserService {
    async registerUser(input) {
        try {
            const password = await bcrypt_1.default.hash(input.password, SALT_ROUNDS);
            const user = await prisma_1.prisma.user.create({
                data: {
                    name: input.username.trim(),
                    email: input.email.trim().toLowerCase(),
                    password,
                },
                select: publicUserSelect,
            });
            return toPublicUser(user);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new AppError_1.AppError(409, "This email address is already registered.");
            }
            throw error;
        }
    }
    async getUser(id) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: parseUserId(id) },
            select: publicUserSelect,
        });
        if (!user)
            throw new AppError_1.AppError(404, "User not found.");
        return toPublicUser(user);
    }
    async updateUser(id, input) {
        const data = {};
        if (input.username !== undefined)
            data.name = input.username.trim();
        if (input.email !== undefined)
            data.email = input.email.trim().toLowerCase();
        if (input.password !== undefined)
            data.password = await bcrypt_1.default.hash(input.password, SALT_ROUNDS);
        if (Object.keys(data).length === 0) {
            throw new AppError_1.AppError(400, "At least one user field must be provided.");
        }
        try {
            const user = await prisma_1.prisma.user.update({
                where: { id: parseUserId(id) },
                data,
                select: publicUserSelect,
            });
            return toPublicUser(user);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new AppError_1.AppError(409, "This email address is already registered.");
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new AppError_1.AppError(404, "User not found.");
            }
            throw error;
        }
    }
    async deleteUser(id) {
        try {
            await prisma_1.prisma.user.delete({ where: { id: parseUserId(id) } });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new AppError_1.AppError(404, "User not found.");
            }
            throw error;
        }
    }
    async getUserDashboard(id) {
        const user = await this.getUser(id);
        const { plans, totalMacroStatistics } = await mealPlanService_1.mealPlanService.getActivePlan(String(user.id));
        return {
            profile: user,
            activeMealPlan: plans,
            totalMacroStatistics,
        };
    }
    async verifyPassword(email, plainPassword) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (!user || !(await bcrypt_1.default.compare(plainPassword, user.password)))
            return null;
        return toPublicUser({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
