import { AppError } from "../errors/AppError";
import { Actor } from "../middleware/authorization";
import { LoginInput } from "../models/auth";
import { ROLE_SCOPES } from "../models/oauth";
import { userService } from "./userService";
import { signAccessToken } from "../utils/jwt";

export class AuthService {
  async login(input: LoginInput) {
    const user = await userService.verifyPassword(input.email, input.password);
    if (!user) throw new AppError(401, "Invalid email or password.");

    return {
      token: signAccessToken({ user: { id: user.id, role: user.role }, scopes: [...ROLE_SCOPES[user.role]] }).token,
      user,
    };
  }

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