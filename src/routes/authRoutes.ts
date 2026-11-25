import { Router } from "express";
import { getCurrentUser, login } from "../controllers/authController";
import { authenticateToken } from "../middleware/authentication";
import { validateLogin } from "../middleware/authValidation";

const router = Router();

router.post("/login", validateLogin, login);
router.get("/me", authenticateToken, getCurrentUser);

export default router;