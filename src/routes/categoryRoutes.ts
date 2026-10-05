import { Router } from 'express';
import { getAllCategories, createCategory, getCategoryById, updateCategory, deleteCategory } from '../controllers/categoryController';
import { validateCategory } from '../middleware/validation';

const router = Router();

router.get('/', getAllCategories);
router.post('/', validateCategory, createCategory);
router.get('/:id', getCategoryById);
router.put('/:id', validateCategory, updateCategory);
router.delete('/:id', deleteCategory);

export default router;