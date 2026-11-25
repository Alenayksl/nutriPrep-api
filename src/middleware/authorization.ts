import { Role } from "@prisma/client";
import { RequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { Scope, toScopeString } from "../models/oauth";

export interface Actor {
  id: number;
  role: Role;
}

export const isAdmin = (actor: Actor): boolean => actor.role === Role.ADMIN;

export const canAccessOwnedBy = (actor: Actor, ownerId: number): boolean =>
  isAdmin(actor) || actor.id === ownerId;

export const assertCanAccessOwnedBy = (actor: Actor, ownerId: number, message: string): void => {
  if (!canAccessOwnedBy(actor, ownerId)) throw new AppError(403, message);
};

export const requireActor = (user: Actor | undefined): Actor => {
  if (!user) throw new AppError(403, "This action requires an access token issued to a user.");
  return user;
};

export const requireScope = (...required: Scope[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new AppError(401, "Authentication is required.", { "WWW-Authenticate": "Bearer" }));
      return;
    }

    const missing = required.filter((scope) => !req.auth!.scopes.includes(scope));
    if (missing.length > 0) {
      next(new AppError(403, `This action requires the following scope(s): ${missing.join(", ")}.`, {
        "WWW-Authenticate": `Bearer error="insufficient_scope", scope="${toScopeString(required)}"`,
      }));
      return;
    }

    next();
  };
};

export const requireScopeIfAuthenticated = (...required: Scope[]): RequestHandler => {
  const check = requireScope(...required);
  return (req, res, next) => {
    if (!req.auth) {
      next();
      return;
    }
    check(req, res, next);
  };
};

export const requireSelfOrAdmin = (param = "id"): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(403, "This action requires an access token issued to a user."));
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
