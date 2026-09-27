import { Request, Response } from 'express';
import { recipes, Recipe } from '../models/recipe';
import { count } from 'node:console'; //neden kullanılmıyor arastır unutma!!


// 1. GET /recipes
export const getAllRecipes = (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        count: recipes.length,
        data: recipes
    });
};

// 2. POST /recipes (Yeni tarif oluştur)
export const createRecipe = (req: Request, res: Response) => {
    const newRecipe: Recipe = req.body; // Gelen veriyi al

    newRecipe.id = (recipes.length + 1).toString(); // Basit bir id ataması (Gerçekte veritabanı kendi verir)

    recipes.push(newRecipe);

    // 201 kodu: "Created" (Başarıyla oluşturuldu) demektir
    res.status(201).json({
        success: true,
        data: newRecipe
    });
};