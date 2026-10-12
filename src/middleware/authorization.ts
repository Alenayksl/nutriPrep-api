import { Role } from "@prisma/client";
import { RequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const requireRole = (...allowedRoles: Role[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Authentication is required."));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, "Administrator role is required."));
      return;
    }

    next();
  };
};