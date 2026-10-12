"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserUpdate = exports.validateUserRegistration = exports.validateMealPlan = exports.validateRecipe = exports.validateCategory = void 0;
const isRecord = (value) => typeof value === "object" && value !== null;
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isStringArray = (value) => Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
const isOptionalNonNegativeNumber = (value) => value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);
const isPositiveInteger = (value) => typeof value === "number" && Number.isInteger(value) && value > 0;
const isCategoryInput = (body) => isRecord(body) && isNonEmptyString(body.name);
const isRecipeInput = (body) => isRecord(body) &&
    isNonEmptyString(body.title) &&
    isStringArray(body.ingredients) &&
    isNonEmptyString(body.instructions) &&
    isPositiveInteger(body.categoryId) &&
    isPositiveInteger(body.authorId) &&
    isOptionalNonNegativeNumber(body.calories) &&
    isOptionalNonNegativeNumber(body.protein) &&
    isOptionalNonNegativeNumber(body.carbs) &&
    isOptionalNonNegativeNumber(body.fat) &&
    (body.description === undefined || isNonEmptyString(body.description)) &&
    (body.isPublic === undefined || typeof body.isPublic === "boolean");
const isMealPlanInput = (body) => isRecord(body) &&
    isPositiveInteger(body.userId) &&
    isPositiveInteger(body.recipeId) &&
    isNonEmptyString(body.dayOfWeek) &&
    isNonEmptyString(body.mealType);
const isUserRegistrationInput = (body) => isRecord(body) &&
    isNonEmptyString(body.username) &&
    isNonEmptyString(body.email) &&
    isNonEmptyString(body.password);
const isUserUpdateInput = (body) => {
    if (!isRecord(body))
        return false;
    const hasUserField = body.username !== undefined || body.email !== undefined || body.password !== undefined;
    return hasUserField &&
        (body.username === undefined || isNonEmptyString(body.username)) &&
        (body.email === undefined || isNonEmptyString(body.email)) &&
        (body.password === undefined || isNonEmptyString(body.password));
};
const validate = (validator, message) => (req, res, next) => {
    if (!validator(req.body)) {
        res.status(400).json({ success: false, message });
        return;
    }
    next();
};
exports.validateCategory = validate(isCategoryInput, "Category name is required.");
exports.validateRecipe = validate(isRecipeInput, "Recipe fields must be valid and complete.");
exports.validateMealPlan = validate(isMealPlanInput, "Meal plan fields must be valid and complete.");
exports.validateUserRegistration = validate(isUserRegistrationInput, "Username, email, and password are required.");
exports.validateUserUpdate = validate(isUserUpdateInput, "At least one valid user field is required.");
