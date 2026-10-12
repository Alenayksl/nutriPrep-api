"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDashboard = exports.registerUser = void 0;
const AppError_1 = require("../errors/AppError");
const mealPlan_1 = require("../models/mealPlan");
const recipe_1 = require("../models/recipe");
const user_1 = require("../models/user");
const toPublicUser = ({ passwordHash: _passwordHash, ...user }) => user;
const registerUser = (input) => {
    if (user_1.users.some((user) => user.email === input.email)) {
        throw new AppError_1.AppError(409, "This email address is already registered.");
    }
    const user = {
        id: `user-${user_1.users.length + 101}`,
        username: input.username,
        email: input.email,
        passwordHash: `mock_hash_${input.password}`,
        role: "Member"
    };
    user_1.users.push(user);
    return toPublicUser(user);
};
exports.registerUser = registerUser;
const getUserDashboard = (userId) => {
    const user = user_1.users.find((item) => item.id === userId);
    if (!user)
        throw new AppError_1.AppError(404, "User not found.");
    const activeMealPlan = mealPlan_1.mealPlans.find((plan) => plan.userId === userId) ?? null;
    const totalMacroStatistics = { protein: 0, carbs: 0, fat: 0 };
    if (activeMealPlan) {
        recipe_1.recipes
            .filter((recipe) => activeMealPlan.recipeIds.includes(recipe.id))
            .forEach((recipe) => {
            totalMacroStatistics.protein += recipe.macros.protein;
            totalMacroStatistics.carbs += recipe.macros.carbs;
            totalMacroStatistics.fat += recipe.macros.fat;
        });
    }
    return {
        profile: toPublicUser(user),
        activeMealPlan,
        totalMacroStatistics
    };
};
exports.getUserDashboard = getUserDashboard;
