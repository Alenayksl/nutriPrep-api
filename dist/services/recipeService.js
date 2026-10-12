"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecipe = exports.updateRecipe = exports.createRecipe = exports.getRecipes = void 0;
const AppError_1 = require("../errors/AppError");
const category_1 = require("../models/category");
const recipe_1 = require("../models/recipe");
const user_1 = require("../models/user");
const nextId = () => {
    const highestId = recipe_1.recipes.reduce((highest, recipe) => Math.max(highest, Number(recipe.id) || 0), 0);
    return (highestId + 1).toString();
};
const assertRelations = (input) => {
    if (!category_1.categories.some((category) => category.id === input.categoryId)) {
        throw new AppError_1.AppError(400, "The selected category does not exist.");
    }
    if (!user_1.users.some((user) => user.id === input.authorId)) {
        throw new AppError_1.AppError(400, "The selected user does not exist.");
    }
};
const getRecipes = () => recipe_1.recipes;
exports.getRecipes = getRecipes;
const createRecipe = (input) => {
    assertRelations(input);
    const recipe = { id: nextId(), ...input };
    recipe_1.recipes.push(recipe);
    return recipe;
};
exports.createRecipe = createRecipe;
const updateRecipe = (id, input) => {
    assertRelations(input);
    const recipe = recipe_1.recipes.find((item) => item.id === id);
    if (!recipe)
        throw new AppError_1.AppError(404, "Recipe not found.");
    Object.assign(recipe, input);
    return recipe;
};
exports.updateRecipe = updateRecipe;
const deleteRecipe = (id) => {
    const index = recipe_1.recipes.findIndex((recipe) => recipe.id === id);
    if (index === -1)
        throw new AppError_1.AppError(404, "Recipe not found.");
    recipe_1.recipes.splice(index, 1);
};
exports.deleteRecipe = deleteRecipe;
