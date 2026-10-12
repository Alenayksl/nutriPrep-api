import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { RecipeFilters, RecipeInput } from "../models/recipe";
import { recipeService } from "../services/recipeService";

const queryValue = (value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    return undefined;
};

const parseQueryNumber = (value: unknown, name: string): number | undefined => {
    const rawValue = queryValue(value);
    if (rawValue === undefined) return undefined;

    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        throw new AppError(400, `${name} must be a non-negative number.`);
    }
    return parsedValue;
};

const parseFilters = (query: Request["query"]): RecipeFilters => {
    const page = parseQueryNumber(query.page, "page") ?? 1;
    const limit = parseQueryNumber(query.limit, "limit") ?? 20;

    if (!Number.isInteger(page) || page < 1) {
        throw new AppError(400, "page must be a positive integer.");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError(400, "limit must be an integer between 1 and 100.");
    }

    return {
        page,
        limit,
        categoryId: parseQueryNumber(query.categoryId, "categoryId"),
        minCalories: parseQueryNumber(query.minCalories, "minCalories"),
        maxCalories: parseQueryNumber(query.maxCalories, "maxCalories"),
        minProtein: parseQueryNumber(query.minProtein, "minProtein"),
        maxProtein: parseQueryNumber(query.maxProtein, "maxProtein"),
        minCarbs: parseQueryNumber(query.minCarbs, "minCarbs"),
        maxCarbs: parseQueryNumber(query.maxCarbs, "maxCarbs"),
        minFat: parseQueryNumber(query.minFat, "minFat"),
        maxFat: parseQueryNumber(query.maxFat, "maxFat"),
    };
};

export const getAllRecipes = async (req: Request, res: Response) => {
    const result = await recipeService.getRecipes(parseFilters(req.query));
    res.status(200).json({ success: true, ...result });
};

export const getRecipeById = async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json({ success: true, data: await recipeService.getRecipe(req.params.id) });
};

export const createRecipe = async (req: Request<Record<string, never>, unknown, RecipeInput>, res: Response) => {
    const recipe = await recipeService.createRecipe(req.body);
    res.status(201).json({ success: true, data: recipe });
};

export const updateRecipe = async (req: Request<{ id: string }, unknown, RecipeInput>, res: Response) => {
    const recipe = await recipeService.updateRecipe(req.params.id, req.body);
    res.status(200).json({ success: true, data: recipe });
};

export const deleteRecipe = async (req: Request<{ id: string }>, res: Response) => {
    await recipeService.deleteRecipe(req.params.id);
    res.status(204).send();
};
