"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMealPlan = exports.updateMealPlan = exports.getMealById = exports.createNewMealPlan = exports.getAllMealPlans = void 0;
const mealPlanService = __importStar(require("../services/mealPlanService"));
const getAllMealPlans = (req, res) => {
    const mealPlans = mealPlanService.getMealPlans();
    res.status(200).json({ success: true, count: mealPlans.length, data: mealPlans });
};
exports.getAllMealPlans = getAllMealPlans;
// POST /mealplans.
const createNewMealPlan = (req, res) => {
    const newPlan = mealPlanService.createMealPlan(req.body);
    res.status(201).json({ success: true, data: newPlan });
};
exports.createNewMealPlan = createNewMealPlan;
// Get a meal plan by ID.
const getMealById = (req, res) => {
    res.status(200).json({ success: true, data: mealPlanService.getMealPlan(req.params.id) });
};
exports.getMealById = getMealById;
const updateMealPlan = (req, res) => {
    res.status(200).json({ success: true, data: mealPlanService.updateMealPlan(req.params.id, req.body) });
};
exports.updateMealPlan = updateMealPlan;
const deleteMealPlan = (req, res) => {
    mealPlanService.deleteMealPlan(req.params.id);
    res.status(204).send();
};
exports.deleteMealPlan = deleteMealPlan;
