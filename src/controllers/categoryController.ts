import { Request, Response } from "express";
import { CategoryInput } from "../models/category";
import { categoryService } from "../services/categoryService";


export const getAllCategories = async (_req: Request, res: Response) => {
  const categories = await categoryService.getCategories();
  res.status(200).json({ success: true, count: categories.length, data: categories });
};

export const createCategory = async (req: Request<Record<string, never>, unknown, CategoryInput>, res: Response) => {
  const newCategory = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, data: newCategory });
};

export const getCategoryById = async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json({ success: true, data: await categoryService.getCategory(req.params.id) });
};

export const updateCategory = async (req: Request<{ id: string }, unknown, CategoryInput>, res: Response) => {
  res.status(200).json({ success: true, data: await categoryService.updateCategory(req.params.id, req.body) });
};

export const deleteCategory = async (req: Request<{ id: string }>, res: Response) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(204).send();
};

