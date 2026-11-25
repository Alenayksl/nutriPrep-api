import { NextFunction, Request, RequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { verifyToken } from "../utils/jwt";

// Verifies the Bearer token and attaches the caller to req.user.
const attachUser = (req: Request, next: NextFunction, authorization: string): void => {
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new AppError(401, "A Bearer authentication token is required."));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
      next(new AppError(401, "Invalid or expired authentication token."));
      return;
    }
    next(error);
  }
};

export const authenticateToken: RequestHandler = (req, _res, next) => {
  attachUser(req, next, req.header("Authorization") ?? "");
};

// For public routes whose response depends on who is asking (e.g. private recipes):
// no header means an anonymous request, but a header that is present must be valid.
export const optionalAuthentication: RequestHandler = (req, _res, next) => {
  const authorization = req.header("Authorization");
  if (!authorization) {
    next();
    return;
  }
  attachUser(req, next, authorization);
};
