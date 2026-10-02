import { Request, Response } from "express";
import { MealPlan, mealPlans } from "../models/mealPlan";

export const getAllMealPlans = (req: Request, res: Response)=>{
res.status(200).json({success: true, count: mealPlans.length , data: mealPlans });
};

//post/mealplans:
export const createNewMealPlan = (req: Request, res: Response) =>{
    const newPlan: MealPlan = req.body;
    newPlan.id = (mealPlans.length +1).toString();

    mealPlans.push(newPlan);

    res.status(200).json({success: true, data: newPlan});
};

//Idye göre plan getiretto:

export const getMealById = (req: Request, res: Response)=>{
    const id = req.params.id;
    const plan = mealPlans.find(p => p.id === id);

    if(!plan){
        res.status(404).json({success: false, message: "Ogun bulunamadi!"});
        return;
    }else{
        res.status(200).json({success: true, data: plan});
    };
};

