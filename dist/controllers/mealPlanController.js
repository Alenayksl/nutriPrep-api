"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMealPlan = exports.updateMealPlan = exports.createNewMealPlan = exports.getMealById = exports.getAllMealPlans = void 0;
const AppError_1 = require("../errors/AppError");
const mealPlanService_1 = require("../services/mealPlanService");
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
    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        throw new AppError_1.AppError(400, `${name} must be a positive integer.`);
    }
    return parsedValue;
};
const parseFilters = (query) => {
    const page = parseQueryNumber(query.page, "page") ?? 1;
    const limit = parseQueryNumber(query.limit, "limit") ?? 20;
    if (limit > 100)
        throw new AppError_1.AppError(400, "limit must be between 1 and 100.");
    return {
        page,
        limit,
        userId: parseQueryNumber(query.userId, "userId"),
        dayOfWeek: queryValue(query.dayOfWeek),
        mealType: queryValue(query.mealType),
    };
};
const getAllMealPlans = async (req, res) => {
    const result = await mealPlanService_1.mealPlanService.getMealPlans(parseFilters(req.query));
    res.status(200).json({ success: true, ...result });
};
exports.getAllMealPlans = getAllMealPlans;
const getMealById = async (req, res) => {
    res.status(200).json({ success: true, data: await mealPlanService_1.mealPlanService.getMealPlan(req.params.id) });
};
exports.getMealById = getMealById;
const createNewMealPlan = async (req, res) => {
    const mealPlan = await mealPlanService_1.mealPlanService.createMealPlan(req.body);
    res.status(201).json({ success: true, data: mealPlan });
};
exports.createNewMealPlan = createNewMealPlan;
const updateMealPlan = async (req, res) => {
    const mealPlan = await mealPlanService_1.mealPlanService.updateMealPlan(req.params.id, req.body);
    res.status(200).json({ success: true, data: mealPlan });
};
exports.updateMealPlan = updateMealPlan;
const deleteMealPlan = async (req, res) => {
    await mealPlanService_1.mealPlanService.deleteMealPlan(req.params.id);
    res.status(204).send();
};
exports.deleteMealPlan = deleteMealPlan;
