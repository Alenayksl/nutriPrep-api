"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.createCategory = exports.getAllCategories = void 0;
const categoryService_1 = require("../services/categoryService");
const getAllCategories = async (_req, res) => {
    const categories = await categoryService_1.categoryService.getCategories();
    res.status(200).json({ success: true, count: categories.length, data: categories });
};
exports.getAllCategories = getAllCategories;
const createCategory = async (req, res) => {
    const newCategory = await categoryService_1.categoryService.createCategory(req.body);
    res.status(201).json({ success: true, data: newCategory });
};
exports.createCategory = createCategory;
const getCategoryById = async (req, res) => {
    res.status(200).json({ success: true, data: await categoryService_1.categoryService.getCategory(req.params.id) });
};
exports.getCategoryById = getCategoryById;
const updateCategory = async (req, res) => {
    res.status(200).json({ success: true, data: await categoryService_1.categoryService.updateCategory(req.params.id, req.body) });
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    await categoryService_1.categoryService.deleteCategory(req.params.id);
    res.status(204).send();
};
exports.deleteCategory = deleteCategory;
