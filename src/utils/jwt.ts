import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { isScope, Scope, toScopeString } from "../models/oauth";

const JWT_ALGORITHM = "HS256";
const MIN_SECRET_LENGTH = 32;
const CLIENT_SUBJECT_PREFIX = "client:";

export interface AccessTokenClaims {
  user?: { id: number; role: Role };
  clientId?: string;
  scopes: Scope[];
}

export interface SignedAccessToken {
  token: string;
  expiresIn: number;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, "JWT secret is not configured.");
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new AppError(500, `JWT secret must be at least ${MIN_SECRET_LENGTH} characters long.`);
  }
  return secret;
};

const invalidToken = () =>
  new AppError(401, "Invalid authentication token.", { "WWW-Authenticate": 'Bearer error="invalid_token"' });

export const signAccessToken = (claims: AccessTokenClaims): SignedAccessToken => {
  const subject = claims.user ? String(claims.user.id) : `${CLIENT_SUBJECT_PREFIX}${claims.clientId}`;
  const options: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"],
    subject,
  };

  const payload = {
    scope: toScopeString(claims.scopes),
    ...(claims.user && { role: claims.user.role }),
    ...(claims.clientId && { client_id: claims.clientId }),
  };
  const token = jwt.sign(payload, getJwtSecret(), options);

  const { iat, exp } = jwt.decode(token) as { iat: number; exp: number };
  return { token, expiresIn: exp - iat };
};

export const verifyAccessToken = (token: string): AccessTokenClaims => {
  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
  if (typeof decoded !== "object" || decoded === null || typeof decoded.sub !== "string") throw invalidToken();

  if (typeof decoded.scope !== "string") throw invalidToken();
  const scopes = decoded.scope.split(" ").filter(Boolean);
  if (!scopes.every(isScope)) throw invalidToken();

  const clientId = typeof decoded.client_id === "string" ? decoded.client_id : undefined;

  if (decoded.sub.startsWith(CLIENT_SUBJECT_PREFIX)) {
    if (!clientId || decoded.sub !== `${CLIENT_SUBJECT_PREFIX}${clientId}`) throw invalidToken();
    return { clientId, scopes };
  }

  const userId = Number(decoded.sub);
  const role = decoded.role;
  if (!Number.isInteger(userId) || userId < 1 || !Object.values(Role).includes(role)) throw invalidToken();

  return { user: { id: userId, role }, clientId, scopes };
};
