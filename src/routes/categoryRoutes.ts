import { Role } from "@prisma/client";
import { Router } from "express";
import { getAllCategories, createCategory, getCategoryById, updateCategory, deleteCategory } from "../controllers/categoryController";
import { authenticateToken } from "../middleware/authentication";
import { requireRole } from "../middleware/authorization";
import { validateCategory } from "../middleware/validation";

const router = Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

router.use(authenticateToken, requireRole(Role.ADMIN));
router.post('/', validateCategory, createCategory);
router.put('/:id', validateCategory, updateCategory);
router.delete('/:id', deleteCategory);

export default router;