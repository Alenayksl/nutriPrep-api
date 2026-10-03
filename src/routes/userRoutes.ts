// src/routes/userRoutes.ts
import { Router } from 'express';
import { registerUser, getCombinedUserProfile } from '../controllers/userController';

const router = Router();

router.post('/register', registerUser);

// Dashboard rotasına istek gelince Combined Resource fonksiyonu çalışacak
router.get('/:id/dashboard', getCombinedUserProfile);

export default router;