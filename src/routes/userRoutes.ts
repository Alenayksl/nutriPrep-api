// User routes.
import { Router } from 'express';
import { registerUser, getUserById, updateUser, deleteUser, getCombinedUserProfile } from '../controllers/userController';
import { getWeeklyMealPlan } from '../controllers/mealPlanController';
import { authenticateToken } from '../middleware/authentication';
import { requireScope, requireSelfOrAdmin } from '../middleware/authorization';
import { validateUserRegistration, validateUserUpdate } from '../middleware/validation';
import { SCOPES } from '../models/oauth';

const router = Router();

router.post('/register', validateUserRegistration, registerUser);

const ownProfile = [authenticateToken, requireScope(SCOPES.PROFILE), requireSelfOrAdmin('id')];
router.get('/:id/dashboard', ownProfile, requireScope(SCOPES.MEALPLANS_READ), getCombinedUserProfile);
router.get('/:id/mealplans/weekly', ownProfile, requireScope(SCOPES.MEALPLANS_READ), getWeeklyMealPlan);
router.get('/:id', ownProfile, getUserById);
router.put('/:id', ownProfile, validateUserUpdate, updateUser);
router.delete('/:id', ownProfile, deleteUser);

export default router;
