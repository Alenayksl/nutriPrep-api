import { Router } from "express";
import { getAllRecipes, getRecipeById, getRecipePresets, createRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";
import { authenticateToken, optionalAuthentication } from "../middleware/authentication";
import { requireScope, requireScopeIfAuthenticated } from "../middleware/authorization";
import { validateRecipe } from "../middleware/validation";
import { SCOPES } from "../models/oauth";

const router = Router();

const readRecipes = [optionalAuthentication, requireScopeIfAuthenticated(SCOPES.RECIPES_READ)];
router.get('/', readRecipes, getAllRecipes);
router.get('/presets', readRecipes, getRecipePresets);
router.get('/:id', readRecipes, getRecipeById);

router.use(authenticateToken, requireScope(SCOPES.RECIPES_WRITE));
router.post('/', validateRecipe, createRecipe);
router.put('/:id', validateRecipe, updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;
