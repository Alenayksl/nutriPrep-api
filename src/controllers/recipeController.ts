import { Request, Response } from 'express';
import { RecipeInput } from '../models/recipe';
import * as recipeService from '../services/recipeService';

// GET /recipes.
export const getAllRecipes = (req: Request, res: Response) => {
    const recipes = recipeService.getRecipes();
    res.status(200).json({
        success: true,
        count: recipes.length,
        data: recipes
    });
};

// POST /recipes.
export const createRecipe = (req: Request<Record<string, never>, unknown, RecipeInput>, res: Response) => {
    const newRecipe = recipeService.createRecipe(req.body);

    res.status(201).json({
        success: true,
        data: newRecipe
    });
};

export const updateRecipe = (req: Request<{ id: string }, unknown, RecipeInput>, res: Response) => {
    res.status(200).json({ success: true, data: recipeService.updateRecipe(req.params.id, req.body) });
};

export const deleteRecipe = (req: Request<{ id: string }>, res: Response) => {
    recipeService.deleteRecipe(req.params.id);
    res.status(204).send();
};