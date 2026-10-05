import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError = error instanceof AppError
    ? error
    : new AppError(500, "An unexpected server error occurred.");

  res.status(appError.statusCode).json({
    success: false,
    message: appError.message
  });
};