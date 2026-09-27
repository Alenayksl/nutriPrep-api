import { Router } from 'express';
import { getAllCategories, createCategory, getCategoryById } from '../controllers/categoryController';

const router = Router();

router.get('/', getAllCategories);
router.post('/', createCategory);
router.get('/:id', getCategoryById);

export default router;