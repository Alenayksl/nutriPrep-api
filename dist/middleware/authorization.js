"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const AppError_1 = require("../errors/AppError");
const requireRole = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            next(new AppError_1.AppError(401, "Authentication is required."));
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            next(new AppError_1.AppError(403, "Administrator role is required."));
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
