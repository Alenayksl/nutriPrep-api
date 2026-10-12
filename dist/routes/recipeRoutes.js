"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recipeController_1 = require("../controllers/recipeController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Forward requests to controllers.
router.get('/', recipeController_1.getAllRecipes);
router.get('/:id', recipeController_1.getRecipeById);
router.post('/', validation_1.validateRecipe, recipeController_1.createRecipe);
router.put('/:id', validation_1.validateRecipe, recipeController_1.updateRecipe);
router.delete('/:id', recipeController_1.deleteRecipe);
exports.default = router;
