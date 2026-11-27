# NutriPrep API Architecture

This document explains how the code is organized and how authentication and authorization work inside the API. For setup and the endpoint reference, see the [README](README.md).

## Request flow

Every request goes through the same layers:

`routes -> middleware -> controllers -> services -> Prisma Client -> PostgreSQL`

| Path                  | Responsibility                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/index.ts`        | Validates `PORT` and starts the HTTP listener                                                           |
| `src/server.ts`       | `createServer()`: builds the Express app, configures CORS and body parsing (JSON and URL-encoded), mounts the routes, and adds the 404 and error handlers. Kept separate from `index.ts` so the app can be created without listening. |
| `src/routes/`         | Maps HTTP methods and paths to controllers, and attaches authentication, scope checks and body validation |
| `src/middleware/`     | Body validation, access-token authentication, scope and ownership checks, and the central error handler |
| `src/controllers/`    | Parse path and query parameters (pagination, filters, presets), call a service, and send the JSON response |
| `src/services/`       | Business rules, ownership checks and Prisma queries                                                      |
| `src/models/`         | Request and domain types, OAuth2 scopes and the role-to-scope map                                       |
| `src/errors/`         | `AppError` (HTTP errors with optional headers) and `OAuthError` (RFC 6749 token endpoint errors)        |
| `src/utils/`          | `jwt.ts` signs and verifies access tokens; `prisma.ts` holds the shared `PrismaClient`                   |
| `src/types/`          | Adds `auth` and `user` to Express's `Request` type                                                      |
| `prisma/`             | Schema, migrations and the seed script                                                                  |

### Services

- `oauthService.ts`: the OAuth2 authorization server. Client authentication, the `password`, `refresh_token` and `client_credentials` grants, refresh token rotation and revocation.
- `authService.ts`: the simple `POST /api/auth/login` and `GET /api/auth/me`.
- `userService.ts`: registration and user CRUD. Passwords are hashed with bcrypt and never returned.
- `recipeService.ts`, `categoryService.ts`, `mealPlanService.ts`: the core resources, including visibility, popularity and shared weekly plans.

### Error handling

Controllers and services throw `AppError` (or `OAuthError`), and Express passes it to `errorHandler`:

- `AppError` becomes `{ "success": false, "message": "..." }` with its status code and headers.
- `OAuthError` becomes `{ "error": "...", "error_description": "..." }`, as RFC 6749 requires.
- Invalid JSON bodies become `400`.
- Prisma errors that a service did not translate (`P2002` unique conflict, `P2025` not found) become `409` and `404`.
- Anything else is logged and returned as a generic `500`.

## Data model

| Model          | Purpose                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `User`         | Account with a `Role` (`GUEST`, `MEMBER`, `ADMIN`). `mealPlanSharedAt` marks a shared weekly plan.   |
| `Category`     | Groups recipes                                                                                       |
| `Recipe`       | Ingredients, instructions and macros. `isPublic` controls visibility; `isSystem` marks admin-provided default recipes. |
| `MealPlan`     | One slot: user + `dayOfWeek` + `mealType` + recipe. Unique per user, day and meal.                   |
| `OAuthClient`  | An application allowed to request tokens: allowed grant types, maximum scopes, optional bcrypt-hashed secret |
| `RefreshToken` | SHA-256 hash of a refresh token, its user, client, scopes, expiry and revocation time                |

Deletes cascade from `User` to its recipes, meal plans and refresh tokens, and from `Recipe` to the meal plan slots that use it.

## Authentication

The API is both the OAuth2 **authorization server** (`POST /api/oauth/token`, `POST /api/oauth/revoke`) and the **resource server**.

- **Access tokens** are HS256 JWTs. They carry `sub` (the user id, or `client:<clientId>` for machine tokens), `role`, `scope` and `client_id`. Verification pins the algorithm, so unsigned (`alg=none`) or differently signed tokens are rejected. `JWT_SECRET` must be at least 32 characters.
- **Refresh tokens** are random strings stored only as SHA-256 hashes. Each one is revoked when it is used and replaced by a new one. If a revoked token is used again, all of that user's refresh tokens for that client are revoked.
- **Clients**: a confidential client must send its secret (HTTP Basic or in the body). A public client only sends its `client_id`.

`authenticateToken` verifies the `Authorization: Bearer` header and puts the claims on `req.auth` (`scopes`, `clientId`, `user`), and the user, if any, on `req.user`. `optionalAuthentication` does the same for public routes, but lets requests without a header through.

## Authorization

Authorization has three layers:

1. **Role → scopes** (`ROLE_SCOPES` in `src/models/oauth.ts`). A token gets at most the scopes of its user's role, limited further by the client and by what was requested. Scopes are recalculated from the user's current role on every refresh.

   | Role     | Scopes                                                                           |
   | -------- | -------------------------------------------------------------------------------- |
   | `GUEST`  | `profile`, `categories:read`, `recipes:read`                                      |
   | `MEMBER` | `GUEST` scopes + `recipes:write`, `mealplans:read`, `mealplans:write`             |
   | `ADMIN`  | `MEMBER` scopes + `categories:write`                                              |

2. **Scope per route** (`requireScope(...)` in `src/middleware/authorization.ts`). Each protected route lists the scopes it needs. A missing scope returns `403` with `WWW-Authenticate: Bearer error="insufficient_scope"`. Public reads use `requireScopeIfAuthenticated(...)`: anonymous requests pass, but a request that sends a token needs the read scope.

3. **Ownership** (`Actor`, `canAccessOwnedBy`, `assertCanAccessOwnedBy`). `ADMIN` passes every ownership check.
   - `/users/:id` routes use the `requireSelfOrAdmin` middleware.
   - Recipe and meal plan services receive the caller and check the stored `authorId` or `userId` before reads of private data, updates and deletes.
   - `authorId` and `userId` in request bodies default to the caller. Members cannot set them to another user.
   - Other users' private recipes answer `404`, so their existence is not revealed.
   - `client_credentials` tokens have no user, so routes that act on a user's data answer them with `403`.

## Sharing and popularity

- Recipes are public by default. `PUT /recipes/:id/visibility` changes `isPublic`. System recipes are always public.
- A user's whole weekly plan is shared or hidden with `PUT /users/:id/mealplans/visibility`, which sets or clears `User.mealPlanSharedAt`. Shared plans only show slots whose recipe is public, and owners appear as `{ id, username }` without email.
- Popularity is the number of `MealPlan` rows that use a recipe. It is returned as `savedCount` and used by `sort=popular` and `GET /recipes/popular`, so no extra table is needed. Saves are counted anonymously.

## Filtering and pagination

Controllers turn query strings into typed filter objects (`RecipeFilters`, `MealPlanFilters`) and reject invalid values with `400`.

- Recipes: `page`, `limit` (1-100, default 20), `categoryId`, min/max calories, protein, carbs and fat, `preset`, `sort` (`newest` or `popular`) and `system`.
- Presets (`high-protein`, `high-carb`, `low-calorie`, `low-fat`) are defined in `RECIPE_PRESETS` and merged with explicit filters; the stricter bound wins.
- Meal plans: `page`, `limit`, `userId` (members may only use their own id; admins may use any), `dayOfWeek` and `mealType`. Entries are sorted by calendar day and meal order rather than alphabetically.

Lists return a consistent envelope:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```
