import { Role } from "@prisma/client";
import { RequestHandler } from "express";
import { AppError } from "../errors/AppError";

// The authenticated caller, as attached to req.user by authenticateToken.
export interface Actor {
  id: number;
  role: Role;
}

export const isAdmin = (actor: Actor): boolean => actor.role === Role.ADMIN;

// Owners may act on their own resources; ADMIN may act on anyone's.
export const canAccessOwnedBy = (actor: Actor, ownerId: number): boolean =>
  isAdmin(actor) || actor.id === ownerId;

export const assertCanAccessOwnedBy = (actor: Actor, ownerId: number, message: string): void => {
  if (!canAccessOwnedBy(actor, ownerId)) throw new AppError(403, message);
};

// Returns req.user, or throws 401 when a route forgot to run authenticateToken first.
export const requireActor = (user: Actor | undefined): Actor => {
  if (!user) throw new AppError(401, "Authentication is required.");
  return user;
};

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

// For /users/:id style routes: only that user or an ADMIN may continue.
// A non-numeric id is left for the service to reject with 400.
export const requireSelfOrAdmin = (param = "id"): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Authentication is required."));
      return;
    }

    const targetId = Number(req.params[param]);
    if (Number.isInteger(targetId) && !canAccessOwnedBy(req.user, targetId)) {
      next(new AppError(403, "You can only access your own user account."));
      return;
    }

    next();
  };
};
