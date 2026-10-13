"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const recipeController_1 = require("../controllers/recipeController");
const authentication_1 = require("../middleware/authentication");
const authorization_1 = require("../middleware/authorization");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Forward requests to controllers.
router.get('/', recipeController_1.getAllRecipes);
router.get('/:id', recipeController_1.getRecipeById);
router.use(authentication_1.authenticateToken, (0, authorization_1.requireRole)(client_1.Role.MEMBER, client_1.Role.ADMIN));
router.post('/', validation_1.validateRecipe, recipeController_1.createRecipe);
router.put('/:id', validation_1.validateRecipe, recipeController_1.updateRecipe);
router.delete('/:id', recipeController_1.deleteRecipe);
exports.default = router;
