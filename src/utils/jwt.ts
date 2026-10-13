import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AppError } from "../errors/AppError";

export interface AuthTokenPayload {
  sub: number;
  role: Role;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, "JWT secret is not configured.");
  return secret;
};

export const generateToken = (payload: AuthTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, getJwtSecret(), options);
};

export const verifyToken = (token: string): AuthTokenPayload => {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded !== "object" || decoded === null) {
    throw new AppError(401, "Invalid authentication token.");
  }

  const userId = Number(decoded.sub);
  const role = decoded.role;
  if (!Number.isInteger(userId) || userId < 1 || !Object.values(Role).includes(role)) {
    throw new AppError(401, "Invalid authentication token.");
  }

  return { sub: userId, role };
};