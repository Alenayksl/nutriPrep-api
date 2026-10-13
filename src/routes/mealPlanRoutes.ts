import { Router } from "express";
import { getAllMealPlans, getMealById, createNewMealPlan, updateMealPlan, deleteMealPlan } from "../controllers/mealPlanController";
import { authenticateToken } from "../middleware/authentication";
import { validateMealPlan } from "../middleware/validation";

const router = Router();

router.use(authenticateToken);
router.get('/', getAllMealPlans);
router.post('/', validateMealPlan, createNewMealPlan);
router.get('/:id', getMealById);
router.put('/:id', validateMealPlan, updateMealPlan);
router.delete('/:id', deleteMealPlan);

export default router;