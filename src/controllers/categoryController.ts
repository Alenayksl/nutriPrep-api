import { Request, Response } from "express";
import { Category, categories } from "../models/category";


export const getAllCategories = (req: Request, res: Response) => {
  res.status(200).json({ success: true, count: categories.length, data: categories });
};

export const createCategory = (req: Request, res: Response) => {
  const newCategory: Category = req.body;
  newCategory.id = (categories.length + 1).toString();
  
  categories.push(newCategory);
  
  res.status(201).json({ success: true, data: newCategory });
};

export const getCategoryById = (req: Request, res: Response) => {
  const id = req.params.id;
  const category = categories.find(c => c.id === id);

  if (!category) {
    res.status(404).json({ success: false, message: "Kategori bulunamadı!" });
    return;
  }
  res.status(200).json({ success: true, data: category });
};

