"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategory = exports.getCategories = void 0;
const AppError_1 = require("../errors/AppError");
const category_1 = require("../models/category");
const nextId = () => {
    const highestId = category_1.categories.reduce((highest, category) => Math.max(highest, Number(category.id) || 0), 0);
    return (highestId + 1).toString();
};
const getCategories = () => category_1.categories;
exports.getCategories = getCategories;
const getCategory = (id) => {
    const category = category_1.categories.find((item) => item.id === id);
    if (!category)
        throw new AppError_1.AppError(404, "Category not found.");
    return category;
};
exports.getCategory = getCategory;
const createCategory = (input) => {
    const category = { id: nextId(), ...input };
    category_1.categories.push(category);
    return category;
};
exports.createCategory = createCategory;
const updateCategory = (id, input) => {
    const category = (0, exports.getCategory)(id);
    Object.assign(category, input);
    return category;
};
exports.updateCategory = updateCategory;
const deleteCategory = (id) => {
    const index = category_1.categories.findIndex((category) => category.id === id);
    if (index === -1)
        throw new AppError_1.AppError(404, "Category not found.");
    category_1.categories.splice(index, 1);
};
exports.deleteCategory = deleteCategory;
