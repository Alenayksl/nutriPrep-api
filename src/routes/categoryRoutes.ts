import { Router } from "express";
import { getAllCategories, createCategory, getCategoryById, updateCategory, deleteCategory } from "../controllers/categoryController";
import { getRecipesByCategory } from "../controllers/recipeController";
import { authenticateToken, optionalAuthentication } from "../middleware/authentication";
import { requireScope, requireScopeIfAuthenticated } from "../middleware/authorization";
import { validateCategory } from "../middleware/validation";
import { SCOPES } from "../models/oauth";

const router = Router();

const readCategories = [optionalAuthentication, requireScopeIfAuthenticated(SCOPES.CATEGORIES_READ)];
router.get('/', readCategories, getAllCategories);
router.get('/:id', readCategories, getCategoryById);
router.get('/:id/recipes', readCategories, requireScopeIfAuthenticated(SCOPES.RECIPES_READ), getRecipesByCategory);

router.use(authenticateToken, requireScope(SCOPES.CATEGORIES_WRITE));
router.post('/', validateCategory, createCategory);
router.put('/:id', validateCategory, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
