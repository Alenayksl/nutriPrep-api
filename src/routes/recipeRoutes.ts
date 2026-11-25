import { Router } from "express";
import { getAllRecipes, getRecipeById, getRecipePresets, getPopularRecipes, createRecipe, updateRecipe, deleteRecipe, setRecipeVisibility } from "../controllers/recipeController";
import { authenticateToken, optionalAuthentication } from "../middleware/authentication";
import { requireScope, requireScopeIfAuthenticated } from "../middleware/authorization";
import { validateRecipe, validateRecipeVisibility } from "../middleware/validation";
import { SCOPES } from "../models/oauth";

const router = Router();

const readRecipes = [optionalAuthentication, requireScopeIfAuthenticated(SCOPES.RECIPES_READ)];
router.get('/', readRecipes, getAllRecipes);
router.get('/presets', readRecipes, getRecipePresets);
router.get('/popular', readRecipes, getPopularRecipes);
router.get('/:id', readRecipes, getRecipeById);

router.use(authenticateToken, requireScope(SCOPES.RECIPES_WRITE));
router.post('/', validateRecipe, createRecipe);
router.put('/:id', validateRecipe, updateRecipe);
router.put('/:id/visibility', validateRecipeVisibility, setRecipeVisibility);
router.delete('/:id', deleteRecipe);

export default router;
