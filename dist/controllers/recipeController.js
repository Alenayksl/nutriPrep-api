"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecipe = exports.updateRecipe = exports.createRecipe = exports.getRecipeById = exports.getAllRecipes = void 0;
const AppError_1 = require("../errors/AppError");
const recipeService_1 = require("../services/recipeService");
const queryValue = (value) => {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value) && typeof value[0] === "string")
        return value[0];
    return undefined;
};
const parseQueryNumber = (value, name) => {
    const rawValue = queryValue(value);
    if (rawValue === undefined)
        return undefined;
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        throw new AppError_1.AppError(400, `${name} must be a non-negative number.`);
    }
    return parsedValue;
};
const parseFilters = (query) => {
    const page = parseQueryNumber(query.page, "page") ?? 1;
    const limit = parseQueryNumber(query.limit, "limit") ?? 20;
    if (!Number.isInteger(page) || page < 1) {
        throw new AppError_1.AppError(400, "page must be a positive integer.");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError_1.AppError(400, "limit must be an integer between 1 and 100.");
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
const getAllRecipes = async (req, res) => {
    const result = await recipeService_1.recipeService.getRecipes(parseFilters(req.query));
    res.status(200).json({ success: true, ...result });
};
exports.getAllRecipes = getAllRecipes;
const getRecipeById = async (req, res) => {
    res.status(200).json({ success: true, data: await recipeService_1.recipeService.getRecipe(req.params.id) });
};
exports.getRecipeById = getRecipeById;
const createRecipe = async (req, res) => {
    const recipe = await recipeService_1.recipeService.createRecipe(req.body);
    res.status(201).json({ success: true, data: recipe });
};
exports.createRecipe = createRecipe;
const updateRecipe = async (req, res) => {
    const recipe = await recipeService_1.recipeService.updateRecipe(req.params.id, req.body);
    res.status(200).json({ success: true, data: recipe });
};
exports.updateRecipe = updateRecipe;
const deleteRecipe = async (req, res) => {
    await recipeService_1.recipeService.deleteRecipe(req.params.id);
    res.status(204).send();
};
exports.deleteRecipe = deleteRecipe;
