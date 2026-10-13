"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const AppError_1 = require("../errors/AppError");
const userService_1 = require("./userService");
const jwt_1 = require("../utils/jwt");
class AuthService {
    async login(input) {
        const user = await userService_1.userService.verifyPassword(input.email, input.password);
        if (!user)
            throw new AppError_1.AppError(401, "Invalid email or password.");
        return {
            token: (0, jwt_1.generateToken)({ sub: user.id, role: user.role }),
            user,
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
