# NutriPrep API

NutriPrep API is a REST backend for recipes, categories, users, and meal plans. It is built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

## Requirements

- Node.js 18+
- PostgreSQL
- npm

## Setup

```bash
npm install
copy .env.example .env
```

Update `.env` with the local PostgreSQL connection and a long random `JWT_SECRET`.

Generate Prisma Client and apply the database migration:

```bash
npm run prisma:generate
npx prisma migrate dev
```

Seed the admin user (needed for category write routes; uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`):

```bash
npm run prisma:seed
```

Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default.

## Environment Variables

| Variable         | Description                           | Example                                                             |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `PORT`           | HTTP port                             | `5000`                                                              |
| `DATABASE_URL`   | PostgreSQL connection string          | `postgresql://USER:PASSWORD@localhost:5432/nutriprep?schema=public` |
| `NODE_ENV`       | Runtime environment                   | `development`                                                       |
| `CORS_ORIGIN`    | Comma-separated frontend origins      | `http://localhost:3000`                                             |
| `JWT_SECRET`     | Secret used to sign and verify tokens | Long random value                                                   |
| `JWT_EXPIRES_IN` | Token lifetime                        | `1h`                                                                |
| `ADMIN_EMAIL`    | Email of the seeded admin user        | `admin@nutriprep.local`                                             |
| `ADMIN_PASSWORD` | Password of the seeded admin user     | Any local value                                                     |
| `REFRESH_TOKEN_EXPIRES_DAYS`  | OAuth2 refresh token lifetime in days          | `30`                |
| `OAUTH_WEB_CLIENT_ID`         | Seeded public client (password + refresh)      | `nutriprep-web`     |
| `OAUTH_SERVICE_CLIENT_ID`     | Seeded confidential machine client             | `nutriprep-service` |
| `OAUTH_SERVICE_CLIENT_SECRET` | Secret of the machine client (seed skips it if unset) | Long random value |

Never commit `.env`. Use `.env.example` as the configuration template.

## Scripts

```bash
npm run dev              # Start the TypeScript development server
npm run build            # Compile TypeScript to dist/
npm start                # Start the compiled server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:seed      # Create or update the admin user and OAuth2 clients
```

## Authentication (OAuth2, role based)

The API is its own OAuth 2.0 authorization server and resource server. Access tokens are short-lived JWTs (HS256, `JWT_EXPIRES_IN`). Refresh tokens are random strings; only their SHA-256 hash is stored in the database.

### Roles become scopes

A token's permissions are **scopes**. The scopes a user can receive come from their role:

| Role     | Scopes                                                                |
| -------- | --------------------------------------------------------------------- |
| `GUEST`  | `profile`, `categories:read`, `recipes:read`                          |
| `MEMBER` | every `GUEST` scope + `recipes:write`, `mealplans:read`, `mealplans:write` |
| `ADMIN`  | every `MEMBER` scope + `categories:write`                             |

Granted scopes = requested scopes ∩ role scopes ∩ the client's allowed scopes. Leaving `scope` empty requests everything allowed. Asking for a scope outside that set returns `invalid_scope`, so a member can never get `categories:write`. A client can also ask for less (e.g. `scope=profile`) to get a token that can only read the profile.

On every refresh, scopes are re-checked against the user's **current** role, so demoting a user takes effect at their next refresh at the latest.

### Clients

`npm run prisma:seed` creates two clients:

| Client              | Type                    | Grants                       | Scopes             |
| ------------------- | ----------------------- | ---------------------------- | ------------------ |
| `nutriprep-web`     | Public (no secret)      | `password`, `refresh_token`  | All (capped by role) |
| `nutriprep-service` | Confidential (secret)   | `client_credentials`         | `categories:read`, `categories:write` |

### Register

```http
POST /api/users/register
Content-Type: application/json

{
  "username": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "strong-password"
}
```

New users get the `MEMBER` role. Passwords are stored as bcrypt hashes and are never returned.

### Get a token: password grant

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=nutriprep-web&username=ada@example.com&password=strong-password
```

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "profile categories:read recipes:read recipes:write mealplans:read mealplans:write",
  "refresh_token": "Vb3..."
}
```

The token endpoint also accepts a JSON body. Add `&scope=profile mealplans:read` to request fewer scopes.

> The password grant is meant for first-party apps such as this project's own frontend. OAuth 2.1 drops it in favor of Authorization Code + PKCE, which needs a browser login page.

### Refresh

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&client_id=nutriprep-web&refresh_token=Vb3...
```

Each refresh token works **once**. The response contains a new one (rotation). If an already-used refresh token is sent again, the API treats it as stolen and revokes every refresh token of that user for that client. A refresh can narrow the scope but never widen it.

### Machine-to-machine: client credentials

```http
POST /api/oauth/token
Authorization: Basic base64(nutriprep-service:<secret>)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

The token represents the client, not a user. It carries no refresh token and works only on routes whose scope the client has, for example category writes. Routes that act on a user's own data (`/auth/me`, `/users/:id`, meal plans, recipe writes) answer `403` to it. Confidential clients can also send `client_id` and `client_secret` in the body.

### Revoke (logout)

```http
POST /api/oauth/revoke
Content-Type: application/x-www-form-urlencoded

client_id=nutriprep-web&token=Vb3...
```

Always answers `200` (RFC 7009), whether or not the token existed.

### Use the token

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

### Errors

The token endpoint answers with the RFC 6749 shape: `{ "error": "invalid_grant", "error_description": "..." }`.

| Error                    | Status | When                                                        |
| ------------------------ | ------ | ----------------------------------------------------------- |
| `invalid_request`        | 400    | Missing `grant_type`, `username`, `refresh_token`, ...      |
| `invalid_client`         | 401    | Unknown client or wrong client secret                       |
| `invalid_grant`          | 400    | Wrong password; expired, revoked or reused refresh token     |
| `unauthorized_client`    | 400    | The client may not use that grant type                      |
| `unsupported_grant_type` | 400    | Unknown grant type                                          |
| `invalid_scope`          | 400    | Requested scope is outside what the role/client allows      |

Protected routes follow RFC 6750: `401` with `WWW-Authenticate: Bearer error="invalid_token"` for a missing, invalid or expired token, and `403` with `error="insufficient_scope"` when the token lacks a required scope.

### Legacy login

`POST /api/auth/login` with `{ "email", "password" }` still works for existing clients. It returns `{ token, user }`, where `token` carries every scope of the user's role and comes without a refresh token. New clients should use `/api/oauth/token`.

`JWT_SECRET` must be at least 32 characters long. Token verification pins the HS256 algorithm.

## API Routes

### Public Routes

| Method | Route                 | Description             |
| ------ | --------------------- | ----------------------- |
| `GET`  | `/api/health`         | Health check            |
| `GET`  | `/api/test`           | Test endpoint           |
| `POST` | `/api/oauth/token`    | OAuth2 token endpoint   |
| `POST` | `/api/oauth/revoke`   | Revoke a refresh token  |
| `POST` | `/api/auth/login`     | Legacy login (JWT)      |
| `POST` | `/api/users/register` | Register a member       |
| `GET`  | `/api/categories`     | List categories         |
| `GET`  | `/api/categories/:id` | Read a category         |
| `GET`  | `/api/categories/:id/recipes` | List recipes in a category |
| `GET`  | `/api/recipes`        | List recipes            |
| `GET`  | `/api/recipes/presets` | List nutrition presets |
| `GET`  | `/api/recipes/popular` | Best recipes: public only, most saved first |
| `GET`  | `/api/recipes/:id`    | Read a recipe           |
| `GET`  | `/api/mealplans/public` | List shared weekly plans |
| `GET`  | `/api/mealplans/public/:userId` | Read one user's shared weekly plan |

Public reads still work without a token. A request that **does** send a token must have the read scope for that route, or it gets `403 insufficient_scope`:

| Route                                                         | Scope needed when a token is sent   |
| ------------------------------------------------------------- | ----------------------------------- |
| `GET /api/categories`, `GET /api/categories/:id`              | `categories:read`                   |
| `GET /api/categories/:id/recipes`                             | `categories:read`, `recipes:read`   |
| `GET /api/recipes`, `/recipes/presets`, `/recipes/popular`, `/recipes/:id` | `recipes:read`          |
| `GET /api/mealplans/public`, `GET /api/mealplans/public/:userId` | `recipes:read`                   |

Every role, `GUEST` included, has both read scopes. A token requested with only `scope=profile` cannot read them.

### Protected Routes

All protected routes require `Authorization: Bearer <access_token>` with the listed scope. Missing scope → `403 insufficient_scope`. `ADMIN` passes every ownership rule and can act on any user's resources.

| Method                         | Route                             | Required scope                     | Ownership rule                    |
| ------------------------------ | --------------------------------- | ---------------------------------- | --------------------------------- |
| `GET`                          | `/api/auth/me`                    | `profile`                          | Returns the caller                |
| `POST`, `PUT`, `DELETE`        | `/api/categories`                 | `categories:write`                 | -                                 |
| `POST`                         | `/api/recipes`                    | `recipes:write`                    | `authorId` defaults to the caller |
| `PUT`, `DELETE`                | `/api/recipes/:id`                | `recipes:write`                    | Recipe author only                |
| `PUT`                          | `/api/recipes/:id/visibility`     | `recipes:write`                    | Recipe author only                |
| `GET`                          | `/api/mealplans`                  | `mealplans:read`                   | Lists the caller's plans only     |
| `GET`                          | `/api/mealplans/:id`              | `mealplans:read`                   | Plan owner only                   |
| `POST`                         | `/api/mealplans`                  | `mealplans:write`                  | `userId` defaults to the caller   |
| `PUT`, `DELETE`                | `/api/mealplans/:id`              | `mealplans:write`                  | Plan owner only                   |
| `GET`, `PUT`, `DELETE`         | `/api/users/:id`                  | `profile`                          | That user only                    |
| `GET`                          | `/api/users/:id/dashboard`        | `profile`, `mealplans:read`        | That user only                    |
| `GET`                          | `/api/users/:id/mealplans/weekly` | `profile`, `mealplans:read`        | That user only                    |
| `PUT`                          | `/api/users/:id/mealplans/visibility` | `profile`, `mealplans:write`   | That user only                    |

Breaking another user's ownership rule returns `403`. Members cannot set `authorId` or `userId` to another user; only an `ADMIN` can.

Deleting a user (by themself or by an `ADMIN`) also deletes their recipes, meal plans and refresh tokens. Other users' meal plan slots that used one of those recipes are removed too.

Recipe reads stay public, but `isPublic: false` recipes are visible only to their author and to `ADMIN`. Send a token on `GET /api/recipes`, `GET /api/recipes/:id` or `GET /api/categories/:id/recipes` to include your own private recipes. Other users get `404` for them, and they cannot be added to another user's meal plan. If a token is sent on these public routes, it must be valid.

## Filtering and Pagination

Recipe listing supports:

```http
GET /api/recipes?page=1&limit=20&categoryId=1&minProtein=20&maxCalories=600
```

Recipes of a single category (same pagination and nutrition filters):

```http
GET /api/categories/8/recipes?page=1&limit=20&maxCalories=600
```

### Nutrition Presets

Presets are named filters computed from the stored macros, so recipes never need to be tagged by hand:

| Preset         | Rule               |
| -------------- | ------------------ |
| `high-protein` | protein >= 25 g    |
| `high-carb`    | carbs >= 50 g      |
| `low-calorie`  | calories <= 400    |
| `low-fat`      | fat <= 10 g        |

They work on both recipe listings and can be combined with commas (AND) or with explicit filters (the stricter bound wins):

```http
GET /api/categories/8/recipes?preset=high-carb
GET /api/recipes?preset=high-protein,low-calorie
```

Sorting and system recipes:

```http
GET /api/recipes?sort=popular          # most saved into meal plans first (default: sort=newest)
GET /api/recipes?system=true           # only NutriPrep default recipes (system=false: only user recipes)
GET /api/recipes/popular?categoryId=8  # "best recipes": public only, always sorted by popularity
```

Every recipe response has `savedCount` (how many meal plan slots use it, counted anonymously, private plans included), `isSystem`, and `author: { id, username }`. Author emails are never returned.

## Sharing: Public and Private

Recipes and weekly meal plans work the same way: the owner decides who sees them, and public ones appear in "best" listings.

|                     | Recipes                                   | Weekly meal plans                                  |
| ------------------- | ----------------------------------------- | -------------------------------------------------- |
| Default             | Public (`isPublic` defaults to `true`)    | Private                                            |
| Share / hide        | `PUT /api/recipes/:id/visibility`         | `PUT /api/users/:id/mealplans/visibility`          |
| Public listing      | `GET /api/recipes`, `GET /api/recipes/popular` | `GET /api/mealplans/public`, `GET /api/mealplans/public/:userId` |
| Who sees private    | Author and `ADMIN`                        | Owner and `ADMIN`                                  |

```http
PUT /api/recipes/12/visibility
Authorization: Bearer <access_token>
Content-Type: application/json

{ "isPublic": false }
```

```http
PUT /api/users/5/mealplans/visibility
Authorization: Bearer <access_token>
Content-Type: application/json

{ "isPublic": true }
```

- A shared weekly plan shows the owner as `{ id, username }` (no email) with all seven days, the daily and weekly macro totals, and `sharedAt`. Shared plans are listed most recently shared first.
- Private recipes never appear in a shared plan; their slots show as `null`.
- An unshared plan answers `404` on `GET /api/mealplans/public/:userId`.
- Saving any public recipe into a private plan is always allowed. It counts toward the recipe's `savedCount`, but nobody can see who saved it.

### System recipes

`ADMIN` can create default NutriPrep recipes with `"isSystem": true`. System recipes are always public (`isPublic: false` → `400`), cannot be hidden, and only `ADMIN` can set or remove the flag (otherwise `403`). Omitting `isSystem` on `PUT` keeps the current value.

## Meal Plan Filters

Meal plan listing supports:

```http
GET /api/mealplans?page=1&limit=20&userId=1&dayOfWeek=Monday&mealType=Lunch
```

### Meal Plans

A meal plan entry is one slot: user + `dayOfWeek` + `mealType` + recipe. `dayOfWeek` must be `Monday`…`Sunday` and `mealType` must be `Breakfast`, `Lunch` or `Dinner`; each user can have only one entry per day and meal (a second one returns `409`). Listings are sorted Monday → Sunday and Breakfast → Lunch → Dinner.

```http
GET /api/mealplans?userId=1&dayOfWeek=Monday   # one day
GET /api/users/1/mealplans/weekly             # whole week, grouped by day with daily and weekly macro totals
```

Collection responses include pagination metadata:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Postman Collection

`postman/NutriPrep-API.postman_collection.json` contains requests for every API method, including error cases (400, 401, 403, 404). Import it into Postman and run it with the Collection Runner: requests save `token`, `adminToken`, `userId`, `categoryId`, `recipeId` and `mealPlanId` into collection variables, and the last folder deletes the created data. The `2b. OAuth2` folder walks through the password, refresh, client credentials and revoke flows. Set the `serviceClientSecret` collection variable to your `OAUTH_SERVICE_CLIENT_SECRET` first.

Before running it, make sure the collection variables `adminEmail`, `adminPassword` and `serviceClientSecret` match `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `OAUTH_SERVICE_CLIENT_SECRET` in your `.env`, and run `npm run prisma:seed` once.

It can also be run from the command line (variables can be overridden with `--env-var`):

```bash
npx newman run postman/NutriPrep-API.postman_collection.json --env-var "adminEmail=admin@nutriprep.local" --env-var "adminPassword=..." --env-var "serviceClientSecret=..."
```

### Where each requirement is shown

| Requirement | Where in the collection |
| ----------- | ----------------------- |
| All API methods work correctly | Folders 1-6 and 8: every `GET`, `POST`, `PUT` and `DELETE` route, each with status and body assertions |
| Correct data is returned | Assertions on response bodies, e.g. preset filters, calendar-ordered weekly plans, macro totals, popularity order, no passwords or emails in responses |
| Authentication and authorisation (OAuth2, JWT) | `2. Auth & Register` (JWT login with role/scope claim checks), `2b. OAuth2` (password, refresh rotation, client credentials, revoke, scope limits), `7. Error Cases` (401/403) and `7b. Authentication & Authorization Proof` |

`7b. Authentication & Authorization Proof` is ordered for a demo:

- **A. Authentication**: a valid token is accepted; a tampered signature, a forged unsigned `alg=none` ADMIN token and a wrong `Authorization` scheme all get `401`.
- **B. Role-based authorization**: the ADMIN token carries `categories:write`; a MEMBER updating or deleting a category gets `403 insufficient_scope`; anonymous writes get `401`.
- **C. Ownership**: a member cannot edit or delete the admin's recipe, read another user's private recipe, or delete another user; the admin can read the member's profile and meal plans and delete any recipe.

## Project Structure

```text
src/
  controllers/   HTTP request and response handlers
  middleware/    validation, authentication, authorization, errors
  models/       TypeScript request and domain types
  routes/       REST route definitions
  services/     business logic and Prisma queries
  utils/        Prisma and JWT helpers
prisma/
  schema.prisma PostgreSQL data model
```

The frontend can use `http://localhost:5000` as its local API base URL and send the JWT in the `Authorization` header for protected requests.
