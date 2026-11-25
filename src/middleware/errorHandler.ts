import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { OAuthError } from "../errors/OAuthError";

const isJsonParseError = (error: unknown): boolean =>
  error instanceof SyntaxError && (error as { type?: string }).type === "entity.parse.failed";

// Fallback for Prisma errors that a service did not translate into a more specific AppError.
const fromPrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError | undefined => {
  switch (error.code) {
    case "P2002":
      return new AppError(409, "A record with the same unique value already exists.");
    case "P2025":
      return new AppError(404, "The requested record was not found.");
    default:
      return undefined;
  }
};

const toAppError = (error: unknown): AppError | undefined => {
  if (error instanceof AppError) return error;
  if (isJsonParseError(error)) {
    return new AppError(400, "Request body must be valid JSON. Check for empty Postman variables or trailing commas.");
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) return fromPrismaError(error);
  return undefined;
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof OAuthError) {
    if (error.code === "invalid_client") res.set("WWW-Authenticate", 'Basic realm="nutriprep"');
    res.set("Cache-Control", "no-store").status(error.statusCode).json({ error: error.code, error_description: error.message });
    return;
  }

  const appError = toAppError(error);
  if (!appError) {
    console.error(`Unexpected error on ${req.method} ${req.originalUrl}:`, error);
  }

  const { statusCode, message, headers } = appError ?? new AppError(500, "An unexpected server error occurred.");
  res.set(headers).status(statusCode).json({ success: false, message });
};
