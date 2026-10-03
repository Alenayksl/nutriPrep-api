// src/controllers/userController.ts
import { Request, Response } from 'express';
import { users, User } from '../models/user';
import { mealPlans } from '../models/mealPlan';
import { recipes } from '../models/recipe';

export const registerUser = (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    
    const newUser: User = {
        id: `user-${users.length + 101}`,
        username,
        email,
        passwordHash: `mock_hash_${password}`, 
        role: 'Member'
    };
    
    users.push(newUser);
    res.status(201).json({ success: true, data: newUser });
};

// İŞTE YAZMADIĞIMIZ O YENİ FONKSİYON (Combined Resource)
export const getCombinedUserProfile = (req: Request, res: Response) => {
    const userId = req.params.id;

    // 1. Kullanıcıyı bul
    const user = users.find(u => u.id === userId);
    if (!user) {
        res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
        return;
    }
    const { passwordHash, ...safeUserData } = user; // Güvenlik için parolayı gizle

    // 2. Kullanıcının öğün planını bul
    const activePlan = mealPlans.find(plan => plan.userId === userId);

    // 3. Plandaki tariflerin makrolarını hesapla
    let totalMacros = { protein: 0, carbs: 0, fat: 0 };
    
    if (activePlan) {
        // Planın içindeki recipeIds (örneğin ["1", "2"]) listesini kullanarak tarifleri bul
        const planRecipes = recipes.filter(recipe => activePlan.recipeIds.includes(recipe.id));
        
        planRecipes.forEach(recipe => {
            totalMacros.protein += recipe.macros.protein;
            totalMacros.carbs += recipe.macros.carbs;
            totalMacros.fat += recipe.macros.fat;
        });
    }

    // 4. Her şeyi tek bir JSON yanıtında birleştir[cite: 3]
    res.status(200).json({
        success: true,
        data: {
            profile: safeUserData,
            activeMealPlan: activePlan || null,
            totalMacroStatistics: totalMacros
        }
    });
};