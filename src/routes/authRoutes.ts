import { Router } from "express";
import { getCurrentUser, login } from "../controllers/authController";
import { authenticateToken } from "../middleware/authentication";
import { requireScope } from "../middleware/authorization";
import { validateLogin } from "../middleware/authValidation";
import { SCOPES } from "../models/oauth";

const router = Router();

router.post("/login", validateLogin, login);
router.get("/me", authenticateToken, requireScope(SCOPES.PROFILE), getCurrentUser);

export default router;
