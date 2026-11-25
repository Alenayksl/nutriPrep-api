import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AppError } from "../errors/AppError";

export interface AuthTokenPayload {
  sub: number;
  role: Role;
}

const JWT_ALGORITHM = "HS256";
const MIN_SECRET_LENGTH = 32;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, "JWT secret is not configured.");
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new AppError(500, `JWT secret must be at least ${MIN_SECRET_LENGTH} characters long.`);
  }
  return secret;
};

export const generateToken = (payload: AuthTokenPayload): string => {
  const options: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"],
  };

  // jsonwebtoken requires `sub` to be a string; verifyToken converts it back to a number.
  return jwt.sign({ role: payload.role }, getJwtSecret(), { ...options, subject: String(payload.sub) });
};

export const verifyToken = (token: string): AuthTokenPayload => {
  // Pinning the algorithm rejects tokens signed with "none" or a different algorithm.
  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
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
