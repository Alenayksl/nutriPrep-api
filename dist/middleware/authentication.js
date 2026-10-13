"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const AppError_1 = require("../errors/AppError");
const jwt_1 = require("../utils/jwt");
const authenticateToken = (req, _res, next) => {
    const authorization = req.header("Authorization");
    const [scheme, token] = authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
        next(new AppError_1.AppError(401, "A Bearer authentication token is required."));
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = { id: payload.sub, role: payload.role };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError || error instanceof jsonwebtoken_1.JsonWebTokenError) {
            next(new AppError_1.AppError(401, "Invalid or expired authentication token."));
            return;
        }
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
