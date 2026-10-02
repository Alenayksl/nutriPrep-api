import { Router } from "express";
import { getAllMealPlans, getMealById, createNewMealPlan} from "../controllers/mealPlanController";

const router = Router();

router.get('/', getAllMealPlans);
router.post('/', createNewMealPlan);
router.get('/:id', getMealById);

export default router;