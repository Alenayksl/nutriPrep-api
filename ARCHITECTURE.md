# NutriPrep API Architecture

The API is organized around the request flow:

`routes -> controllers -> services -> Prisma client -> PostgreSQL`

- `src/server.ts`: creates the Express application, loads dotenv, configures CORS and JSON parsing, registers REST routes, and returns JSON for health, test, and 404 responses.
- `src/index.ts`: validates `PORT` and starts the HTTP listener. Keeping this separate makes `createServer()` easy to test.
- `src/routes/`: maps HTTP methods and resource paths to controllers.
- `src/controllers/`: translates HTTP requests into service calls and formats JSON responses.
- `src/services/`: owns business rules, filtering, pagination, and Prisma queries.
- `src/middleware/`: shared concerns such as validation, error handling, access-token authentication, scope and ownership authorization, and pagination parsing.
- `src/utils/jwt.ts`: signs and verifies access tokens (subject, role, scopes, client id).
- `src/services/oauthService.ts`: the OAuth2 authorization server. It handles client authentication, the password / refresh_token / client_credentials grants, refresh token rotation and revocation.
- `src/services/authService.ts`: the legacy `POST /api/auth/login` and `GET /api/auth/me`.
- `src/models/oauth.ts`: scopes, the role-to-scope map (`ROLE_SCOPES`) and the token request/response types.
- `src/utils/prisma.ts`: owns the singleton `PrismaClient` instance used by database-backed services.
- `src/models/`: request and domain input types. All four core entity services now use Prisma persistence.
- `src/services/userService.ts`: manages User CRUD with bcrypt password hashing and public response sanitization; passwords are never returned.
- `prisma/`: PostgreSQL schema and migrations for `User`, `Recipe`, `Category`, `MealPlan`, `OAuthClient`, and `RefreshToken`.

## Roles and OAuth2

The Prisma `Role` enum is the source of truth: `GUEST`, `MEMBER`, and `ADMIN`.

The API acts as both the OAuth2 **authorization server** (`POST /api/oauth/token`, `POST /api/oauth/revoke`) and the **resource server**.

- Clients are rows in `OAuthClient`. Each row lists its allowed grant types and the most scopes it may receive. A confidential client stores a bcrypt-hashed secret; a public client has no secret.
- Refresh tokens are rows in `RefreshToken`, holding only a SHA-256 hash. They are rotated on every use. Reusing an old one revokes that user's tokens for that client.
- Access tokens are HS256 JWTs carrying `sub` (user id, or `client:<clientId>` for machine tokens), `role`, `scope` and `client_id`. Verification pins the algorithm. `JWT_SECRET` must be at least 32 characters.

### Role-based authorization

Authorization has three layers:

1. **Role → scopes** (`ROLE_SCOPES` in `src/models/oauth.ts`): a token gets at most the scopes of its user's role, further limited by the client and by what was requested. Scopes are re-derived from the current role on every refresh.
2. **Scope per route** (`requireScope(...)`): each protected route lists the scopes it needs. A missing scope gives `403` with `WWW-Authenticate: Bearer error="insufficient_scope"`. Public category and recipe reads use `requireScopeIfAuthenticated(...)`: anonymous requests pass, while a request with a token needs `categories:read` / `recipes:read`.
3. **Ownership** (`Actor`, `canAccessOwnedBy`, `assertCanAccessOwnedBy` in `src/middleware/authorization.ts`): `ADMIN` passes every ownership check.
   - `/users/:id` routes use `requireSelfOrAdmin`.
   - Recipe and meal-plan services take the caller (`Actor`) and check the stored `authorId` / `userId` before updates and deletes.
   - `authorId` / `userId` in request bodies default to the caller, and members cannot point them at another user.
   - Public recipe reads use `optionalAuthentication`, so a caller can see their own `isPublic: false` recipes and others cannot.
   - `client_credentials` tokens have no user (`req.user` is unset), so user-owned routes answer them with `403`.

`authenticateToken` puts the verified claims on `req.auth` (`scopes`, `clientId`, `user`) and the user, if any, on `req.user`.

Policy:

- `GUEST`: read categories and their recipes (`categories:read`, `recipes:read`) plus their own profile. Anonymous requests can still read public data.
- `MEMBER`: recipe and meal-plan operations on the member's own data.
- `ADMIN`: category management and any operation on any user's data.

## Filtering and pagination

Collection endpoints should accept query parameters such as `page`, `limit`, `search`, `categoryId`, and `isPublic`. Parse and clamp them in a reusable middleware or `services/query` helper, then pass a typed object to the service. Services should return a consistent envelope:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

This keeps controllers thin and allows Prisma queries to evolve without changing the Next.js client contract.
