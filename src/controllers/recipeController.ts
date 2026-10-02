import { Request, Response } from 'express';
import { recipes, Recipe } from '../models/recipe';
import { categories } from '../models/category';

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
    // req.body'yi doğrudan Recipe'e eşitlemek yerine, Destructuring ile 
    // sadece kendi belirlediğimiz güvenli alanları cımbızlıyoruz[cite: 2].
    const { title, ingredients, macros, categoryId, authorId } = req.body;

    // Basit Veri Doğrulama (İsteğe bağlı ama önerilen katı kural)
    if (!title || !ingredients || !macros || !macros.protein || !macros.carbs || !macros.fat || !categoryId || !authorId) {
        res.status(400).json({
            success: false,
            message: "Hata: Eksik veya hatalı veri gönderdiniz."
        });
        return;
    }

    // İlişkisel Veri Kontrolü: Kullanıcının gönderdiği kategori sistemde gerçekten var mı?
    const categoryExists = categories.find(c => c.id === categoryId);
    
    if (!categoryExists) {
        res.status(400).json({ 
            success: false, 
            message: "Hata: Seçilen kategori sistemde bulunamadı!" 
        });
        return;
    }

   const newRecipe: Recipe = {
        id: (recipes.length + 1).toString(),
        title,
        ingredients,
        macros,
        categoryId,
        authorId
    };

    recipes.push(newRecipe);

    // 201 kodu: "Created" (Başarıyla oluşturuldu) demektir
    res.status(201).json({
        success: true,
        data: newRecipe
    });
};