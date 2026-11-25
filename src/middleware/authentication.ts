import { NextFunction, Request, RequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../utils/jwt";

const unauthorized = (message: string, error?: "invalid_token" | "invalid_request") =>
  new AppError(401, message, { "WWW-Authenticate": error ? `Bearer error="${error}"` : "Bearer" });

const attachAuth = (req: Request, next: NextFunction, authorization: string): void => {
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(unauthorized("A Bearer authentication token is required."));
    return;
  }

  try {
    const claims = verifyAccessToken(token);
    req.auth = claims;
    req.user = claims.user;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
      next(unauthorized("Invalid or expired authentication token.", "invalid_token"));
      return;
    }
    next(error);
  }
};

export const authenticateToken: RequestHandler = (req, _res, next) => {
  attachAuth(req, next, req.header("Authorization") ?? "");
};

export const optionalAuthentication: RequestHandler = (req, _res, next) => {
  const authorization = req.header("Authorization");
  if (!authorization) {
    next();
    return;
  }
  attachAuth(req, next, authorization);
};
