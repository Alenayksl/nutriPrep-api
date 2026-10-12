import { Router } from "express";
import { getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";
import { validateRecipe } from "../middleware/validation";

const router = Router();

// Forward requests to controllers.

router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/', validateRecipe, createRecipe);
router.put('/:id', validateRecipe, updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;