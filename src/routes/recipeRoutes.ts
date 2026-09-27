import { Router } from "express";
import { getAllRecipes, createRecipe } from "../controllers/recipeController";

const router = Router();

// İstekleri aşçılara (controller'a) yönlendiriyoruz

router.get('/', getAllRecipes); // GET isteği gelirse getAllRecipes çalışsın
router.post('/', createRecipe); // POST isteği gelirse createRecipe çalışsın

export default router;