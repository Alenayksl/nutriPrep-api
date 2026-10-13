import { Role } from "@prisma/client";
import { Router } from "express";
import { getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";
import { authenticateToken } from "../middleware/authentication";
import { requireRole } from "../middleware/authorization";
import { validateRecipe } from "../middleware/validation";

const router = Router();

// Forward requests to controllers.

router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);

router.use(authenticateToken, requireRole(Role.MEMBER, Role.ADMIN));
router.post('/', validateRecipe, createRecipe);
router.put('/:id', validateRecipe, updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;