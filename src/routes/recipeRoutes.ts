import { Role } from "@prisma/client";
import { Router } from "express";
import { getAllRecipes, getRecipeById, getRecipePresets, createRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";
import { authenticateToken, optionalAuthentication } from "../middleware/authentication";
import { requireRole } from "../middleware/authorization";
import { validateRecipe } from "../middleware/validation";

const router = Router();

// Reads are public; a token (if sent) also reveals the caller's own private recipes.
router.get('/', optionalAuthentication, getAllRecipes);
router.get('/presets', getRecipePresets);
router.get('/:id', optionalAuthentication, getRecipeById);

// Writes: MEMBER or ADMIN; the service also limits update/delete to the recipe's author or an ADMIN.

router.use(authenticateToken, requireRole(Role.MEMBER));
router.post('/', validateRecipe, createRecipe);
router.put('/:id', validateRecipe, updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;