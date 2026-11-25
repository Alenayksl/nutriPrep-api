// User routes.
import { Router } from 'express';
import { registerUser, getUserById, updateUser, deleteUser, getCombinedUserProfile } from '../controllers/userController';
import { getWeeklyMealPlan } from '../controllers/mealPlanController';
import { authenticateToken } from '../middleware/authentication';
import { requireSelfOrAdmin } from '../middleware/authorization';
import { validateUserRegistration, validateUserUpdate } from '../middleware/validation';

const router = Router();

router.post('/register', validateUserRegistration, registerUser);

// Each /:id route is limited to that user themself or an ADMIN.
const selfOrAdmin = [authenticateToken, requireSelfOrAdmin('id')];
router.get('/:id/dashboard', selfOrAdmin, getCombinedUserProfile);
router.get('/:id/mealplans/weekly', selfOrAdmin, getWeeklyMealPlan);
router.get('/:id', selfOrAdmin, getUserById);
router.put('/:id', selfOrAdmin, validateUserUpdate, updateUser);
router.delete('/:id', selfOrAdmin, deleteUser);

export default router;