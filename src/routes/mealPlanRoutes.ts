import { Router } from "express";
import { getAllMealPlans, getMealById, createNewMealPlan, updateMealPlan, deleteMealPlan, getPublicMealPlans, getPublicMealPlan } from "../controllers/mealPlanController";
import { authenticateToken, optionalAuthentication } from "../middleware/authentication";
import { requireScope, requireScopeIfAuthenticated } from "../middleware/authorization";
import { validateMealPlan } from "../middleware/validation";
import { SCOPES } from "../models/oauth";

const router = Router();

const canRead = requireScope(SCOPES.MEALPLANS_READ);
const canWrite = requireScope(SCOPES.MEALPLANS_WRITE);

const readPublic = [optionalAuthentication, requireScopeIfAuthenticated(SCOPES.RECIPES_READ)];
router.get('/public', readPublic, getPublicMealPlans);
router.get('/public/:userId', readPublic, getPublicMealPlan);

router.use(authenticateToken);
router.get('/', canRead, getAllMealPlans);
router.post('/', canWrite, validateMealPlan, createNewMealPlan);
router.get('/:id', canRead, getMealById);
router.put('/:id', canWrite, validateMealPlan, updateMealPlan);
router.delete('/:id', canWrite, deleteMealPlan);

export default router;
