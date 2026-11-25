import { Role } from "@prisma/client";

export const SCOPES = {
  PROFILE: "profile",
  CATEGORIES_READ: "categories:read",
  RECIPES_READ: "recipes:read",
  RECIPES_WRITE: "recipes:write",
  MEALPLANS_READ: "mealplans:read",
  MEALPLANS_WRITE: "mealplans:write",
  CATEGORIES_WRITE: "categories:write",
} as const;

export type Scope = (typeof SCOPES)[keyof typeof SCOPES];

export const ALL_SCOPES: readonly Scope[] = Object.values(SCOPES);

export const isScope = (value: string): value is Scope => (ALL_SCOPES as readonly string[]).includes(value);

const GUEST_SCOPES: Scope[] = [SCOPES.PROFILE, SCOPES.CATEGORIES_READ, SCOPES.RECIPES_READ];
const MEMBER_SCOPES: Scope[] = [...GUEST_SCOPES, SCOPES.RECIPES_WRITE, SCOPES.MEALPLANS_READ, SCOPES.MEALPLANS_WRITE];
const ADMIN_SCOPES: Scope[] = [...MEMBER_SCOPES, SCOPES.CATEGORIES_WRITE];

export const ROLE_SCOPES: Record<Role, readonly Scope[]> = {
  GUEST: GUEST_SCOPES,
  MEMBER: MEMBER_SCOPES,
  ADMIN: ADMIN_SCOPES,
};

export const GRANT_TYPES = {
  PASSWORD: "password",
  REFRESH_TOKEN: "refresh_token",
  CLIENT_CREDENTIALS: "client_credentials",
} as const;

export type GrantType = (typeof GRANT_TYPES)[keyof typeof GRANT_TYPES];

export interface TokenRequest {
  grant_type?: string;
  username?: string;
  password?: string;
  refresh_token?: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export interface RevokeRequest {
  token?: string;
  token_type_hint?: string;
  client_id?: string;
  client_secret?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export const parseScopeString = (scope: string | undefined): string[] =>
  (scope ?? "").split(" ").map((s) => s.trim()).filter(Boolean);

export const toScopeString = (scopes: readonly string[]): string => scopes.join(" ");
