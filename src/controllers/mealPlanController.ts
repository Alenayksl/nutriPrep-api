import { Request, Response } from "express";
import { MealPlanInput } from "../models/mealPlan";
import * as mealPlanService from "../services/mealPlanService";

export const getAllMealPlans = (req: Request, res: Response)=>{
const mealPlans = mealPlanService.getMealPlans();
res.status(200).json({success: true, count: mealPlans.length , data: mealPlans });
};

// POST /mealplans.
export const createNewMealPlan = (req: Request<Record<string, never>, unknown, MealPlanInput>, res: Response) =>{
    const newPlan = mealPlanService.createMealPlan(req.body);

    res.status(201).json({success: true, data: newPlan});
};

// Get a meal plan by ID.

export const getMealById = (req: Request<{ id: string }>, res: Response)=>{
    res.status(200).json({success: true, data: mealPlanService.getMealPlan(req.params.id)});
};

export const updateMealPlan = (req: Request<{ id: string }, unknown, MealPlanInput>, res: Response) => {
    res.status(200).json({success: true, data: mealPlanService.updateMealPlan(req.params.id, req.body)});
};

export const deleteMealPlan = (req: Request<{ id: string }>, res: Response) => {
    mealPlanService.deleteMealPlan(req.params.id);
    res.status(204).send();
};

