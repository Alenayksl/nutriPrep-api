import { AppError } from "../errors/AppError";
import { Actor } from "../middleware/authorization";
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

  // Reads the user fresh from the database, so a deleted account is rejected even with a valid token.
  async getCurrentUser(actor: Actor) {
    try {
      return await userService.getUser(String(actor.id));
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        throw new AppError(401, "The account for this token no longer exists.");
      }
      throw error;
    }
  }
}

export const authService = new AuthService();