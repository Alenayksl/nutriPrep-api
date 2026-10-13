// User routes.
import { Router } from 'express';
import { registerUser, getUserById, updateUser, deleteUser, getCombinedUserProfile } from '../controllers/userController';
import { authenticateToken } from '../middleware/authentication';
import { validateUserRegistration, validateUserUpdate } from '../middleware/validation';

const router = Router();

router.post('/register', validateUserRegistration, registerUser);

router.use(authenticateToken);
router.get('/:id/dashboard', getCombinedUserProfile);
router.get('/:id', getUserById);
router.put('/:id', validateUserUpdate, updateUser);
router.delete('/:id', deleteUser);

export default router;