"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../errors/AppError");
const errorHandler = (error, _req, res, _next) => {
    const appError = error instanceof AppError_1.AppError
        ? error
        : new AppError_1.AppError(500, "An unexpected server error occurred.");
    res.status(appError.statusCode).json({
        success: false,
        message: appError.message
    });
};
exports.errorHandler = errorHandler;
