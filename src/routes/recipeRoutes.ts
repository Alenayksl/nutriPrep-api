import { Router } from "express";
import { getAllRecipes, createRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";
import { validateRecipe } from "../middleware/validation";

const router = Router();

// Forward requests to controllers.

router.get('/', getAllRecipes);
router.post('/', validateRecipe, createRecipe);
router.put('/:id', validateRecipe, updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;