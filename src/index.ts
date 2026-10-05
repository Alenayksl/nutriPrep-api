// src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recipeRoutes from './routes/recipeRoutes';
import categoryRoutes from './routes/categoryRoutes';
import mealPlanRoutes from './routes/mealPlanRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load settings from the .env file.
dotenv.config();

// Create the Express application.
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration.
// cors allows requests from different domains, such as a React client.
app.use(cors());
// Parse JSON request bodies.
app.use(express.json());

// --- ROUTE REGISTRATION ---
// Forward requests under /api/recipes to the recipe router.
app.use('/api/recipes' , recipeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/mealplans', mealPlanRoutes);
app.use('/api/users', userRoutes);

// Basic health check endpoint.
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: "NutriPrep API is running!",
    version: "1.0.0"
  });
});

// Error middleware must be registered after all routes.
app.use(errorHandler);

// Start the server after all middleware and routes are registered.
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});