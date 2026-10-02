import { Router } from "express";
import { registerUser, getUserProfile } from "../controllers/userController";

const router = Router();

router.post('/register', registerUser);
router.get('/:id/profile', getUserProfile);

export default router;