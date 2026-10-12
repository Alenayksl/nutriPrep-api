"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserRegistration = exports.validateMealPlan = exports.validateRecipe = exports.validateCategory = void 0;
const isRecord = (value) => typeof value === "object" && value !== null;
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isStringArray = (value) => Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
const isMacros = (value) => {
    if (!isRecord(value))
        return false;
    return ["protein", "carbs", "fat"].every((key) => {
        const macro = value[key];
        return typeof macro === "number" && Number.isFinite(macro) && macro >= 0;
    });
};
const isCategoryInput = (body) => isRecord(body) && isNonEmptyString(body.name) && isNonEmptyString(body.description);
const isRecipeInput = (body) => isRecord(body) &&
    isNonEmptyString(body.title) &&
    isStringArray(body.ingredients) &&
    isMacros(body.macros) &&
    isNonEmptyString(body.categoryId) &&
    isNonEmptyString(body.authorId);
const isMealPlanInput = (body) => isRecord(body) &&
    isNonEmptyString(body.userId) &&
    isNonEmptyString(body.title) &&
    isStringArray(body.recipeIds);
const isUserRegistrationInput = (body) => isRecord(body) &&
    isNonEmptyString(body.username) &&
    isNonEmptyString(body.email) &&
    isNonEmptyString(body.password);
const validate = (validator, message) => (req, res, next) => {
    if (!validator(req.body)) {
        res.status(400).json({ success: false, message });
        return;
    }
    next();
};
exports.validateCategory = validate(isCategoryInput, "Category name and description are required.");
exports.validateRecipe = validate(isRecipeInput, "Recipe fields must be valid and complete.");
exports.validateMealPlan = validate(isMealPlanInput, "Meal plan fields must be valid and complete.");
exports.validateUserRegistration = validate(isUserRegistrationInput, "Username, email, and password are required.");
