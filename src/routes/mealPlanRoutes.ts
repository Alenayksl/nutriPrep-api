import { Router } from "express";
import { getAllMealPlans, getMealById, createNewMealPlan, updateMealPlan, deleteMealPlan} from "../controllers/mealPlanController";
import { validateMealPlan } from "../middleware/validation";

const router = Router();

router.get('/', getAllMealPlans);
router.post('/', validateMealPlan, createNewMealPlan);
router.get('/:id', getMealById);
router.put('/:id', validateMealPlan, updateMealPlan);
router.delete('/:id', deleteMealPlan);

export default router;