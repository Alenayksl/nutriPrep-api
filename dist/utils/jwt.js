"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const AppError_1 = require("../errors/AppError");
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new AppError_1.AppError(500, "JWT secret is not configured.");
    return secret;
};
const generateToken = (payload) => {
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h"),
    };
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
    if (typeof decoded !== "object" || decoded === null) {
        throw new AppError_1.AppError(401, "Invalid authentication token.");
    }
    const userId = Number(decoded.sub);
    const role = decoded.role;
    if (!Number.isInteger(userId) || userId < 1 || !Object.values(client_1.Role).includes(role)) {
        throw new AppError_1.AppError(401, "Invalid authentication token.");
    }
    return { sub: userId, role };
};
exports.verifyToken = verifyToken;
