"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMealPlan = exports.updateMealPlan = exports.createMealPlan = exports.getMealPlan = exports.getMealPlans = void 0;
const AppError_1 = require("../errors/AppError");
const mealPlan_1 = require("../models/mealPlan");
const recipe_1 = require("../models/recipe");
const user_1 = require("../models/user");
const nextId = () => {
    const highestId = mealPlan_1.mealPlans.reduce((highest, plan) => Math.max(highest, Number(plan.id) || 0), 0);
    return (highestId + 1).toString();
};
const assertRelations = (input) => {
    if (!user_1.users.some((user) => user.id === input.userId)) {
        throw new AppError_1.AppError(400, "The selected user does not exist.");
    }
    if (input.recipeIds.some((recipeId) => !recipe_1.recipes.some((recipe) => recipe.id === recipeId))) {
        throw new AppError_1.AppError(400, "A recipe in the meal plan does not exist.");
    }
};
const getMealPlans = () => mealPlan_1.mealPlans;
exports.getMealPlans = getMealPlans;
const getMealPlan = (id) => {
    const plan = mealPlan_1.mealPlans.find((item) => item.id === id);
    if (!plan)
        throw new AppError_1.AppError(404, "Meal plan not found.");
    return plan;
};
exports.getMealPlan = getMealPlan;
const createMealPlan = (input) => {
    assertRelations(input);
    const plan = { id: nextId(), ...input };
    mealPlan_1.mealPlans.push(plan);
    return plan;
};
exports.createMealPlan = createMealPlan;
const updateMealPlan = (id, input) => {
    assertRelations(input);
    const plan = (0, exports.getMealPlan)(id);
    Object.assign(plan, input);
    return plan;
};
exports.updateMealPlan = updateMealPlan;
const deleteMealPlan = (id) => {
    const index = mealPlan_1.mealPlans.findIndex((plan) => plan.id === id);
    if (index === -1)
        throw new AppError_1.AppError(404, "Meal plan not found.");
    mealPlan_1.mealPlans.splice(index, 1);
};
exports.deleteMealPlan = deleteMealPlan;
