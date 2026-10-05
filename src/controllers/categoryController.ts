import { Request, Response } from "express";
import { CategoryInput } from "../models/category";
import * as categoryService from "../services/categoryService";


export const getAllCategories = (req: Request, res: Response) => {
  const categories = categoryService.getCategories();
  res.status(200).json({ success: true, count: categories.length, data: categories });
};

export const createCategory = (req: Request<Record<string, never>, unknown, CategoryInput>, res: Response) => {
  const newCategory = categoryService.createCategory(req.body);
  res.status(201).json({ success: true, data: newCategory });
};

export const getCategoryById = (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json({ success: true, data: categoryService.getCategory(req.params.id) });
};

export const updateCategory = (req: Request<{ id: string }, unknown, CategoryInput>, res: Response) => {
  res.status(200).json({ success: true, data: categoryService.updateCategory(req.params.id, req.body) });
};

export const deleteCategory = (req: Request<{ id: string }>, res: Response) => {
  categoryService.deleteCategory(req.params.id);
  res.status(204).send();
};

