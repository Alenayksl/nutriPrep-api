import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { PublicUser, UserRegistrationInput, UserUpdateInput } from "../models/user";
import { mealPlanService } from "./mealPlanService";
import { prisma } from "../utils/prisma";

const SALT_ROUNDS = 12;

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  mealPlanSharedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const parseUserId = (id: string): number => {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new AppError(400, "User id must be a positive integer.");
  }
  return parsedId;
};

const toPublicUser = (user: Prisma.UserGetPayload<{ select: typeof publicUserSelect }>): PublicUser => ({
  id: user.id,
  username: user.name,
  email: user.email,
  role: user.role,
  isMealPlanPublic: user.mealPlanSharedAt !== null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class UserService {
  async registerUser(input: UserRegistrationInput): Promise<PublicUser> {
    try {
      const password = await bcrypt.hash(input.password, SALT_ROUNDS);
      const user = await prisma.user.create({
        data: {
          name: input.username.trim(),
          email: input.email.trim().toLowerCase(),
          password,
        },
        select: publicUserSelect,
      });

      return toPublicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "This email address is already registered.");
      }
      throw error;
    }
  }

  async getUser(id: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id: parseUserId(id) },
      select: publicUserSelect,
    });

    if (!user) throw new AppError(404, "User not found.");
    return toPublicUser(user);
  }

  async updateUser(id: string, input: UserUpdateInput): Promise<PublicUser> {
    const data: Prisma.UserUpdateInput = {};
    if (input.username !== undefined) data.name = input.username.trim();
    if (input.email !== undefined) data.email = input.email.trim().toLowerCase();
    if (input.password !== undefined) data.password = await bcrypt.hash(input.password, SALT_ROUNDS);
    if (Object.keys(data).length === 0) {
      throw new AppError(400, "At least one user field must be provided.");
    }

    try {
      const user = await prisma.user.update({
        where: { id: parseUserId(id) },
        data,
        select: publicUserSelect,
      });
      return toPublicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "This email address is already registered.");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "User not found.");
      }
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await prisma.user.delete({ where: { id: parseUserId(id) } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "User not found.");
      }
      throw error;
    }
  }

  async getUserDashboard(id: string) {
    const user = await this.getUser(id);
    const { plans, totalMacroStatistics } = await mealPlanService.getActivePlan(String(user.id));

    return {
      profile: user,
      activeMealPlan: plans,
      totalMacroStatistics,
    };
  }

  async verifyPassword(email: string, plainPassword: string): Promise<PublicUser | null> {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(plainPassword, user.password))) return null;

    return toPublicUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mealPlanSharedAt: user.mealPlanSharedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}

export const userService = new UserService();