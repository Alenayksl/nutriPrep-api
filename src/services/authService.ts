import { AppError } from "../errors/AppError";
import { LoginInput } from "../models/auth";
import { userService } from "./userService";
import { generateToken } from "../utils/jwt";

export class AuthService {
  async login(input: LoginInput) {
    const user = await userService.verifyPassword(input.email, input.password);
    if (!user) throw new AppError(401, "Invalid email or password.");

    return {
      token: generateToken({ sub: user.id, role: user.role }),
      user,
    };
  }
}

export const authService = new AuthService();