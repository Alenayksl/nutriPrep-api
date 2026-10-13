"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const mealPlanRoutes_1 = __importDefault(require("./routes/mealPlanRoutes"));
const recipeRoutes_1 = __importDefault(require("./routes/recipeRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const parseAllowedOrigins = () => (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const createServer = () => {
    const app = (0, express_1.default)();
    const allowedOrigins = parseAllowedOrigins();
    app.use((0, cors_1.default)({
        origin: allowedOrigins,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.get("/api/health", (_req, res) => {
        res.status(200).json({
            success: true,
            data: {
                status: "ok",
                service: "nutriprep-api",
                timestamp: new Date().toISOString(),
            },
        });
    });
    app.get("/api/test", (_req, res) => {
        res.status(200).json({
            success: true,
            message: "NutriPrep API test endpoint is working.",
        });
    });
    app.use("/api/recipes", recipeRoutes_1.default);
    app.use("/api/categories", categoryRoutes_1.default);
    app.use("/api/mealplans", mealPlanRoutes_1.default);
    app.use("/api/users", userRoutes_1.default);
    app.use("/api/auth", authRoutes_1.default);
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found.",
        });
    });
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createServer = createServer;
const app = (0, exports.createServer)();
exports.default = app;
