import { Router } from "express";
import { getAllMealPlans, getMealById, createNewMealPlan, updateMealPlan, deleteMealPlan } from "../controllers/mealPlanController";
import { authenticateToken } from "../middleware/authentication";
import { requireScope } from "../middleware/authorization";
import { validateMealPlan } from "../middleware/validation";
import { SCOPES } from "../models/oauth";

const router = Router();

const canRead = requireScope(SCOPES.MEALPLANS_READ);
const canWrite = requireScope(SCOPES.MEALPLANS_WRITE);

router.use(authenticateToken);
router.get('/', canRead, getAllMealPlans);
router.post('/', canWrite, validateMealPlan, createNewMealPlan);
router.get('/:id', canRead, getMealById);
router.put('/:id', canWrite, validateMealPlan, updateMealPlan);
router.delete('/:id', canWrite, deleteMealPlan);

export default router;
