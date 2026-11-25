import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import categoryRoutes from "./routes/categoryRoutes";
import authRoutes from "./routes/authRoutes";
import mealPlanRoutes from "./routes/mealPlanRoutes";
import oauthRoutes from "./routes/oauthRoutes";
import recipeRoutes from "./routes/recipeRoutes";
import userRoutes from "./routes/userRoutes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const parseAllowedOrigins = (): string[] =>
  (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const createServer = () => {
  const app = express();
  const allowedOrigins = parseAllowedOrigins();

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        service: "nutriprep-api",
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get("/api/test", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "NutriPrep API test endpoint is working.",
    });
  });

  app.use("/api/recipes", recipeRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/mealplans", mealPlanRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/oauth", oauthRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "Route not found.",
    });
  });

  app.use(errorHandler);

  return app;
};

const app = createServer();

export default app;