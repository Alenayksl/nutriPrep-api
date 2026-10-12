import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { MealPlanFilters, MealPlanInput } from "../models/mealPlan";
import { mealPlanService } from "../services/mealPlanService";

const queryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
};

const parseQueryNumber = (value: unknown, name: string): number | undefined => {
  const rawValue = queryValue(value);
  if (rawValue === undefined) return undefined;

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new AppError(400, `${name} must be a positive integer.`);
  }
  return parsedValue;
};

const parseFilters = (query: Request["query"]): MealPlanFilters => {
  const page = parseQueryNumber(query.page, "page") ?? 1;
  const limit = parseQueryNumber(query.limit, "limit") ?? 20;
  if (limit > 100) throw new AppError(400, "limit must be between 1 and 100.");

  return {
    page,
    limit,
    userId: parseQueryNumber(query.userId, "userId"),
    dayOfWeek: queryValue(query.dayOfWeek),
    mealType: queryValue(query.mealType),
  };
};

export const getAllMealPlans = async (req: Request, res: Response) => {
  const result = await mealPlanService.getMealPlans(parseFilters(req.query));
  res.status(200).json({ success: true, ...result });
};

export const getMealById = async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json({ success: true, data: await mealPlanService.getMealPlan(req.params.id) });
};

export const createNewMealPlan = async (req: Request<Record<string, never>, unknown, MealPlanInput>, res: Response) => {
  const mealPlan = await mealPlanService.createMealPlan(req.body);
  res.status(201).json({ success: true, data: mealPlan });
};

export const updateMealPlan = async (req: Request<{ id: string }, unknown, MealPlanInput>, res: Response) => {
  const mealPlan = await mealPlanService.updateMealPlan(req.params.id, req.body);
  res.status(200).json({ success: true, data: mealPlan });
};

export const deleteMealPlan = async (req: Request<{ id: string }>, res: Response) => {
  await mealPlanService.deleteMealPlan(req.params.id);
  res.status(204).send();
};