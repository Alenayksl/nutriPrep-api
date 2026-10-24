import { Role } from "@prisma/client";
import { RequestHandler } from "express";
import { AppError } from "../errors/AppError";

// ADMIN has every permission, so it always passes regardless of allowedRoles.
export const requireRole = (...allowedRoles: Role[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Authentication is required."));
      return;
    }

    if (req.user.role !== Role.ADMIN && !allowedRoles.includes(req.user.role)) {
      next(new AppError(403, `This action requires one of the following roles: ${allowedRoles.join(", ")}.`));
      return;
    }

    next();
  };
};
