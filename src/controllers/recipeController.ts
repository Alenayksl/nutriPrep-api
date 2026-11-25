import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { requireActor } from "../middleware/authorization";
import { NutritionFilters, RECIPE_PRESETS, RecipeFilters, RecipeInput, RecipePreset } from "../models/recipe";
import { categoryService } from "../services/categoryService";
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

const isRecipePreset = (value: string): value is RecipePreset => Object.hasOwn(RECIPE_PRESETS, value);

const parsePresets = (value: unknown): RecipePreset[] => {
    const rawValue = queryValue(value);
    if (rawValue === undefined) return [];

    const names = rawValue.split(",").map((name) => name.trim()).filter(Boolean);
    const unknown = names.filter((name) => !isRecipePreset(name));
    if (unknown.length > 0) {
        const allowed = Object.keys(RECIPE_PRESETS).join(", ");
        throw new AppError(400, `Unknown preset: ${unknown.join(", ")}. Allowed presets: ${allowed}.`);
    }
    return names as RecipePreset[];
};

// Combines presets with explicit filters, keeping the stricter bound when both set the same field.
const applyPresets = (filters: RecipeFilters, presets: RecipePreset[]): RecipeFilters =>
    presets.reduce((result, preset) => {
        const merged: RecipeFilters = { ...result };
        for (const [key, value] of Object.entries(RECIPE_PRESETS[preset].filters) as [keyof NutritionFilters, number][]) {
            const current = merged[key];
            merged[key] = current === undefined
                ? value
                : key.startsWith("min") ? Math.max(current, value) : Math.min(current, value);
        }
        return merged;
    }, filters);

const parseFilters = (query: Request["query"]): RecipeFilters => {
    const page = parseQueryNumber(query.page, "page") ?? 1;
    const limit = parseQueryNumber(query.limit, "limit") ?? 20;

    if (!Number.isInteger(page) || page < 1) {
        throw new AppError(400, "page must be a positive integer.");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError(400, "limit must be an integer between 1 and 100.");
    }

    return applyPresets({
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
    }, parsePresets(query.preset));
};

export const getRecipePresets = (_req: Request, res: Response) => {
    const data = Object.entries(RECIPE_PRESETS).map(([name, preset]) => ({ name, ...preset }));
    res.status(200).json({ success: true, data });
};

export const getAllRecipes = async (req: Request, res: Response) => {
    const result = await recipeService.getRecipes(parseFilters(req.query), req.user);
    res.status(200).json({ success: true, ...result });
};

export const getRecipesByCategory = async (req: Request<{ id: string }>, res: Response) => {
    const category = await categoryService.getCategory(req.params.id);
    const result = await recipeService.getRecipes({ ...parseFilters(req.query), categoryId: category.id }, req.user);
    res.status(200).json({ success: true, ...result });
};

export const getRecipeById = async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json({ success: true, data: await recipeService.getRecipe(req.params.id, req.user) });
};

export const createRecipe = async (req: Request<Record<string, never>, unknown, RecipeInput>, res: Response) => {
    const recipe = await recipeService.createRecipe(req.body, requireActor(req.user));
    res.status(201).json({ success: true, data: recipe });
};

export const updateRecipe = async (req: Request<{ id: string }, unknown, RecipeInput>, res: Response) => {
    const recipe = await recipeService.updateRecipe(req.params.id, req.body, requireActor(req.user));
    res.status(200).json({ success: true, data: recipe });
};

export const deleteRecipe = async (req: Request<{ id: string }>, res: Response) => {
    await recipeService.deleteRecipe(req.params.id, requireActor(req.user));
    res.status(204).send();
};
