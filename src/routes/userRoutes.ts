// User routes.
import { Router } from 'express';
import { registerUser, getCombinedUserProfile } from '../controllers/userController';
import { validateUserRegistration } from '../middleware/validation';

const router = Router();

router.post('/register', validateUserRegistration, registerUser);

// Return the combined user dashboard resource.
router.get('/:id/dashboard', getCombinedUserProfile);

export default router;