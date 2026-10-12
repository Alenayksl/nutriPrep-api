import { Role } from "@prisma/client";
import { Router } from "express";
import { getAllCategories, createCategory, getCategoryById, updateCategory, deleteCategory } from "../controllers/categoryController";
import { requireRole } from "../middleware/authorization";
import { validateCategory } from "../middleware/validation";

const router = Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', requireRole(Role.ADMIN), validateCategory, createCategory);
router.put('/:id', validateCategory, updateCategory);
router.delete('/:id', deleteCategory);

export default router;