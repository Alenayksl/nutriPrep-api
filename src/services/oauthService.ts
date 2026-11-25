import bcrypt from "bcrypt";
import crypto from "crypto";
import { OAuthClient, Role } from "@prisma/client";
import { OAuthError } from "../errors/OAuthError";
import {
  GRANT_TYPES,
  isScope,
  parseScopeString,
  RevokeRequest,
  ROLE_SCOPES,
  Scope,
  TokenRequest,
  TokenResponse,
  toScopeString,
} from "../models/oauth";
import { signAccessToken } from "../utils/jwt";
import { prisma } from "../utils/prisma";
import { userService } from "./userService";

const DEFAULT_REFRESH_TOKEN_DAYS = 30;

export interface ClientCredentials {
  clientId?: string;
  clientSecret?: string;
}

const refreshTokenLifetimeMs = (): number => {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? DEFAULT_REFRESH_TOKEN_DAYS);
  return (Number.isFinite(days) && days > 0 ? days : DEFAULT_REFRESH_TOKEN_DAYS) * 24 * 60 * 60 * 1000;
};

const hashToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");

export const parseClientCredentials = (authorization: string | undefined, body: TokenRequest | RevokeRequest): ClientCredentials => {
  const [scheme, encoded] = authorization?.split(" ") ?? [];
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) throw new OAuthError("invalid_client", "Malformed Basic client credentials.");
    return {
      clientId: decodeURIComponent(decoded.slice(0, separator)),
      clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
    };
  }
  return { clientId: body.client_id, clientSecret: body.client_secret };
};

const authenticateClient = async ({ clientId, clientSecret }: ClientCredentials): Promise<OAuthClient> => {
  if (!clientId) throw new OAuthError("invalid_client", "client_id is required.");

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  if (!client) throw new OAuthError("invalid_client", "Unknown client or invalid client credentials.");

  if (client.clientSecret) {
    if (!clientSecret || !(await bcrypt.compare(clientSecret, client.clientSecret))) {
      throw new OAuthError("invalid_client", "Unknown client or invalid client credentials.");
    }
  }
  return client;
};

const resolveScopes = (requested: string | undefined, allowed: readonly Scope[]): Scope[] => {
  const requestedScopes = parseScopeString(requested);
  if (requestedScopes.length === 0) {
    if (allowed.length === 0) throw new OAuthError("invalid_scope", "No scopes are available for this request.");
    return [...allowed];
  }

  const notAllowed = requestedScopes.filter((scope) => !isScope(scope) || !allowed.includes(scope));
  if (notAllowed.length > 0) {
    throw new OAuthError("invalid_scope", `Scope not allowed: ${notAllowed.join(", ")}. Allowed: ${toScopeString(allowed) || "(none)"}.`);
  }
  return [...new Set(requestedScopes)] as Scope[];
};

const userAllowedScopes = (role: Role, client: OAuthClient): Scope[] =>
  ROLE_SCOPES[role].filter((scope) => client.scopes.includes(scope));

export class OAuthService {
  async token(body: TokenRequest, credentials: ClientCredentials): Promise<TokenResponse> {
    if (!body.grant_type) throw new OAuthError("invalid_request", "grant_type is required.");

    const client = await authenticateClient(credentials);
    if (!client.grantTypes.includes(body.grant_type)) {
      const known = Object.values(GRANT_TYPES) as string[];
      if (!known.includes(body.grant_type)) {
        throw new OAuthError("unsupported_grant_type", `Supported grant types: ${known.join(", ")}.`);
      }
      throw new OAuthError("unauthorized_client", `This client may not use the ${body.grant_type} grant.`);
    }

    switch (body.grant_type) {
      case GRANT_TYPES.PASSWORD:
        return this.passwordGrant(body, client);
      case GRANT_TYPES.REFRESH_TOKEN:
        return this.refreshTokenGrant(body, client);
      case GRANT_TYPES.CLIENT_CREDENTIALS:
        return this.clientCredentialsGrant(body, client);
      default:
        throw new OAuthError("unsupported_grant_type", `Unsupported grant type: ${body.grant_type}.`);
    }
  }

  async revoke(body: RevokeRequest, credentials: ClientCredentials): Promise<void> {
    const client = await authenticateClient(credentials);
    if (!body.token) throw new OAuthError("invalid_request", "token is required.");

    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(body.token), clientId: client.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async passwordGrant(body: TokenRequest, client: OAuthClient): Promise<TokenResponse> {
    if (!body.username || !body.password) {
      throw new OAuthError("invalid_request", "username and password are required for the password grant.");
    }

    const user = await userService.verifyPassword(body.username, body.password);
    if (!user) throw new OAuthError("invalid_grant", "Invalid username or password.");

    const scopes = resolveScopes(body.scope, userAllowedScopes(user.role, client));
    return this.issueUserTokens(user.id, user.role, scopes, client);
  }

  private async refreshTokenGrant(body: TokenRequest, client: OAuthClient): Promise<TokenResponse> {
    if (!body.refresh_token) throw new OAuthError("invalid_request", "refresh_token is required.");

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(body.refresh_token) },
      include: { user: { select: { id: true, role: true } } },
    });
    if (!stored || stored.clientId !== client.id) throw new OAuthError("invalid_grant", "Invalid refresh token.");

    if (stored.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, clientId: client.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new OAuthError("invalid_grant", "Refresh token has already been used or revoked.");
    }
    if (stored.expiresAt <= new Date()) throw new OAuthError("invalid_grant", "Refresh token has expired.");

    const original = parseScopeString(stored.scope).filter(isScope);
    const allowed = userAllowedScopes(stored.user.role, client).filter((scope) => original.includes(scope));
    const scopes = resolveScopes(body.scope, allowed);

    const { count } = await prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new OAuthError("invalid_grant", "Refresh token has already been used or revoked.");

    return this.issueUserTokens(stored.user.id, stored.user.role, scopes, client);
  }

  private async clientCredentialsGrant(body: TokenRequest, client: OAuthClient): Promise<TokenResponse> {
    if (!client.clientSecret) {
      throw new OAuthError("unauthorized_client", "Public clients cannot use the client_credentials grant.");
    }

    const scopes = resolveScopes(body.scope, client.scopes.filter(isScope));
    const { token, expiresIn } = signAccessToken({ clientId: client.clientId, scopes });
    return { access_token: token, token_type: "Bearer", expires_in: expiresIn, scope: toScopeString(scopes) };
  }

  private async issueUserTokens(userId: number, role: Role, scopes: Scope[], client: OAuthClient): Promise<TokenResponse> {
    const { token, expiresIn } = signAccessToken({ user: { id: userId, role }, clientId: client.clientId, scopes });
    const response: TokenResponse = {
      access_token: token,
      token_type: "Bearer",
      expires_in: expiresIn,
      scope: toScopeString(scopes),
    };

    if (client.grantTypes.includes(GRANT_TYPES.REFRESH_TOKEN)) {
      const refreshToken = crypto.randomBytes(32).toString("base64url");
      await prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(refreshToken),
          userId,
          clientId: client.id,
          scope: toScopeString(scopes),
          expiresAt: new Date(Date.now() + refreshTokenLifetimeMs()),
        },
      });
      response.refresh_token = refreshToken;
    }

    return response;
  }
}

export const oauthService = new OAuthService();
