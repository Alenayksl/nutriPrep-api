# NutriPrep API

A REST API for planning healthy meals: browse recipes by category and nutrition, build a weekly meal plan, and share recipes and plans with other users. It includes its own OAuth 2.0 authorization server with role-based access control.

Built with **Node.js**, **Express 5**, **TypeScript**, **Prisma** and **PostgreSQL**.

## Features

- **Recipes and categories** with calories and macros, pagination, nutrition filters and named presets (`high-protein`, `low-calorie`, ...)
- **Weekly meal plans** with one recipe per day and meal (Breakfast, Lunch, Dinner), plus daily and weekly macro totals
- **Sharing**: recipes and weekly plans can be public or private
- **Popular recipes**, ranked by how many meal plans saved them
- **System recipes**: default recipes provided by admins
- **OAuth 2.0** token endpoint with the password, refresh token and client credentials grants, refresh token rotation and revocation
- **Role-based authorization**: each role maps to a set of OAuth2 scopes, and ownership rules keep users' data their own
- **Postman collection** with automated tests for every endpoint

## Tech stack

| Area           | Technology                                   |
| -------------- | -------------------------------------------- |
| Runtime        | Node.js 18+                                  |
| Framework      | Express 5                                    |
| Language       | TypeScript                                   |
| Database / ORM | PostgreSQL, Prisma                           |
| Auth           | OAuth 2.0, JWT (`jsonwebtoken`), bcrypt      |
| Testing        | Postman / Newman                             |

## Getting started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL
- npm

### Installation

```bash
git clone https://github.com/Alenayksl/nutriPrep-api.git
cd nutriPrep-api
npm install
```

Create your environment file from the template and fill it in (see [Environment variables](#environment-variables)):

```bash
cp .env.example .env        # Windows: copy .env.example .env
```

Create the database tables, then seed the admin user and the OAuth2 clients:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Check that it is up:

```bash
curl http://localhost:5000/api/health
```

### Environment variables

| Variable                      | Description                                              | Example                                                             |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| `PORT`                        | HTTP port                                                | `5000`                                                              |
| `DATABASE_URL`                | PostgreSQL connection string                             | `postgresql://USER:PASSWORD@localhost:5432/nutriprep?schema=public` |
| `NODE_ENV`                    | Runtime environment                                      | `development`                                                       |
| `CORS_ORIGIN`                 | Allowed frontend origins, comma-separated                | `http://localhost:3000`                                             |
| `JWT_SECRET`                  | Secret for signing access tokens (at least 32 characters) | Long random value                                                   |
| `JWT_EXPIRES_IN`              | Access token lifetime                                    | `1h`                                                                |
| `REFRESH_TOKEN_EXPIRES_DAYS`  | Refresh token lifetime in days                           | `30`                                                                |
| `ADMIN_EMAIL`                 | Email of the seeded admin user                           | `admin@nutriprep.local`                                             |
| `ADMIN_PASSWORD`              | Password of the seeded admin user                        | Any strong value                                                    |
| `OAUTH_WEB_CLIENT_ID`         | ID of the seeded public client                           | `nutriprep-web`                                                     |
| `OAUTH_SERVICE_CLIENT_ID`     | ID of the seeded machine-to-machine client               | `nutriprep-service`                                                 |
| `OAUTH_SERVICE_CLIENT_SECRET` | Secret of the machine client (skipped by the seed if unset) | Long random value                                                |

Never commit `.env`; it is listed in `.gitignore`.

### Scripts

| Command                   | Description                                        |
| ------------------------- | -------------------------------------------------- |
| `npm run dev`             | Start the development server with auto-reload      |
| `npm run build`           | Compile TypeScript to `dist/`                      |
| `npm start`               | Run the compiled server                            |
| `npm run prisma:generate` | Generate the Prisma Client                         |
| `npm run prisma:migrate`  | Create and apply migrations during development     |
| `npm run prisma:seed`     | Create or update the admin user and OAuth2 clients |

## Authentication and authorization

The API is both an OAuth 2.0 **authorization server** (it issues tokens) and a **resource server** (it checks them).

- **Access tokens** are short-lived JWTs signed with HS256. They carry the user's id, role and scopes.
- **Refresh tokens** are random strings. Only their SHA-256 hash is stored. Each one works once and is replaced on use (rotation). Reusing an old one revokes every refresh token of that user for that client.
- **Passwords** are hashed with bcrypt and never returned by the API.

### Roles and scopes

Every user has a role. A role decides which **scopes** (permissions) a token can carry:

| Role     | Scopes                                                                            |
| -------- | --------------------------------------------------------------------------------- |
| `GUEST`  | `profile`, `categories:read`, `recipes:read`                                       |
| `MEMBER` | everything `GUEST` has, plus `recipes:write`, `mealplans:read`, `mealplans:write`  |
| `ADMIN`  | everything `MEMBER` has, plus `categories:write`                                   |

New users are registered as `MEMBER`. A token never gets more than its role allows; requesting more returns `invalid_scope`. Clients may request fewer scopes, for example `scope=profile`.

On top of scopes, **ownership rules** apply: users can only change their own recipes, meal plans and account. `ADMIN` can act on any user's data.

### OAuth2 clients

`npm run prisma:seed` creates two clients:

| Client              | Type                  | Grant types                 | Scopes                                |
| ------------------- | --------------------- | --------------------------- | ------------------------------------- |
| `nutriprep-web`     | Public (no secret)    | `password`, `refresh_token` | All, capped by the user's role        |
| `nutriprep-service` | Confidential (secret) | `client_credentials`        | `categories:read`, `categories:write` |

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

### Get a token

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=nutriprep-web&username=ada@example.com&password=strong-password
```

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "profile categories:read recipes:read recipes:write mealplans:read mealplans:write",
  "refresh_token": "Vb3k..."
}
```

Send the access token on protected requests:

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

The token endpoint also accepts a JSON body.

### Refresh a token

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&client_id=nutriprep-web&refresh_token=Vb3k...
```

The response contains a new access token and a new refresh token.

### Log out (revoke)

```http
POST /api/oauth/revoke
Content-Type: application/x-www-form-urlencoded

client_id=nutriprep-web&token=Vb3k...
```

The refresh token can no longer be used. The access token expires on its own.

### Machine-to-machine (client credentials)

```http
POST /api/oauth/token
Authorization: Basic base64(nutriprep-service:<secret>)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

The token belongs to the client, not to a user, so it only works on routes whose scope the client has (category management).

> The password grant is intended for first-party clients such as this project's own frontend.

### Simple login

`POST /api/auth/login` with `{ "email": "...", "password": "..." }` returns `{ token, user }`. The token has every scope of the user's role but no refresh token. New clients should prefer `/api/oauth/token`.

## API reference

All routes are prefixed with `/api`. "Public" routes work without a token. If a token is sent to a public route, it must be valid and carry the listed read scope.

### System

| Method | Route     | Access | Description  |
| ------ | --------- | ------ | ------------ |
| `GET`  | `/health` | Public | Health check |

### Auth

| Method | Route           | Access    | Description                       |
| ------ | --------------- | --------- | --------------------------------- |
| `POST` | `/oauth/token`  | Public    | Get or refresh a token (OAuth2)   |
| `POST` | `/oauth/revoke` | Public    | Revoke a refresh token (log out)  |
| `POST` | `/auth/login`   | Public    | Simple email/password login       |
| `GET`  | `/auth/me`      | `profile` | Current user                      |

### Users

| Method   | Route                           | Access                        | Description                         |
| -------- | ------------------------------- | ----------------------------- | ----------------------------------- |
| `POST`   | `/users/register`               | Public                        | Register a new member               |
| `GET`    | `/users/:id`                    | `profile`, self or admin      | Get a user                          |
| `PUT`    | `/users/:id`                    | `profile`, self or admin      | Update username, email or password  |
| `DELETE` | `/users/:id`                    | `profile`, self or admin      | Delete a user and all of their data |
| `GET`    | `/users/:id/dashboard`          | `profile`, `mealplans:read`, self or admin  | Profile, meal plans and macro totals |
| `GET`    | `/users/:id/mealplans/weekly`   | `profile`, `mealplans:read`, self or admin  | The week grouped by day with totals  |
| `PUT`    | `/users/:id/mealplans/visibility` | `profile`, `mealplans:write`, self or admin | Share or hide the weekly plan      |

### Categories

| Method   | Route                    | Access                          | Description                 |
| -------- | ------------------------ | ------------------------------- | --------------------------- |
| `GET`    | `/categories`            | Public (`categories:read`)      | List categories             |
| `GET`    | `/categories/:id`        | Public (`categories:read`)      | Get a category              |
| `GET`    | `/categories/:id/recipes`| Public (`categories:read`, `recipes:read`) | Recipes in a category |
| `POST`   | `/categories`            | `categories:write`              | Create a category           |
| `PUT`    | `/categories/:id`        | `categories:write`              | Update a category           |
| `DELETE` | `/categories/:id`        | `categories:write`              | Delete an empty category    |

### Recipes

| Method   | Route                     | Access                          | Description                                  |
| -------- | ------------------------- | ------------------------------- | -------------------------------------------- |
| `GET`    | `/recipes`                | Public (`recipes:read`)         | List recipes with filters and pagination     |
| `GET`    | `/recipes/presets`        | Public (`recipes:read`)         | List the nutrition presets                   |
| `GET`    | `/recipes/popular`        | Public (`recipes:read`)         | Public recipes, most saved first             |
| `GET`    | `/recipes/:id`            | Public (`recipes:read`)         | Get a recipe                                 |
| `POST`   | `/recipes`                | `recipes:write`                 | Create a recipe (author is the caller)       |
| `PUT`    | `/recipes/:id`            | `recipes:write`, author or admin | Update a recipe                             |
| `PUT`    | `/recipes/:id/visibility` | `recipes:write`, author or admin | Make a recipe public or private             |
| `DELETE` | `/recipes/:id`            | `recipes:write`, author or admin | Delete a recipe                             |

Example body for `POST /recipes`:

```json
{
  "title": "Grilled Chicken Bowl",
  "description": "High-protein lunch bowl",
  "ingredients": ["chicken breast", "rice", "broccoli"],
  "instructions": "Grill the chicken, cook the rice, steam the broccoli and combine.",
  "calories": 550,
  "protein": 45,
  "carbs": 60,
  "fat": 12,
  "isPublic": true,
  "categoryId": 1
}
```

### Meal plans

| Method   | Route                       | Access                            | Description                         |
| -------- | --------------------------- | --------------------------------- | ----------------------------------- |
| `GET`    | `/mealplans/public`         | Public (`recipes:read`)           | List shared weekly plans            |
| `GET`    | `/mealplans/public/:userId` | Public (`recipes:read`)           | Get one user's shared weekly plan   |
| `GET`    | `/mealplans`                | `mealplans:read`                  | List your own meal plan entries     |
| `GET`    | `/mealplans/:id`            | `mealplans:read`, owner or admin  | Get a meal plan entry               |
| `POST`   | `/mealplans`                | `mealplans:write`                 | Add a recipe to a day and meal      |
| `PUT`    | `/mealplans/:id`            | `mealplans:write`, owner or admin | Update a meal plan entry            |
| `DELETE` | `/mealplans/:id`            | `mealplans:write`, owner or admin | Delete a meal plan entry            |

Example body for `POST /mealplans`:

```json
{
  "recipeId": 12,
  "dayOfWeek": "Monday",
  "mealType": "Lunch"
}
```

`dayOfWeek` is `Monday` to `Sunday`, and `mealType` is `Breakfast`, `Lunch` or `Dinner`. Each user has at most one entry per day and meal; a second one returns `409`.

## Querying recipes

### Filters and pagination

```http
GET /api/recipes?page=1&limit=20&categoryId=1&minProtein=20&maxCalories=600
```

| Parameter                                  | Description                                        |
| ------------------------------------------ | -------------------------------------------------- |
| `page`, `limit`                            | Pagination (`limit` up to 100, default 20)         |
| `categoryId`                               | Only recipes in this category                      |
| `minCalories`, `maxCalories`               | Calorie range                                      |
| `minProtein`, `maxProtein`                 | Protein range (g)                                  |
| `minCarbs`, `maxCarbs`                     | Carbohydrate range (g)                             |
| `minFat`, `maxFat`                         | Fat range (g)                                      |
| `preset`                                   | One or more presets, comma-separated               |
| `sort`                                     | `newest` (default) or `popular`                    |
| `system`                                   | `true` for system recipes only, `false` to exclude them |

The same parameters work on `GET /api/categories/:id/recipes` and `GET /api/recipes/popular`.

### Nutrition presets

| Preset         | Rule               |
| -------------- | ------------------ |
| `high-protein` | protein ≥ 25 g     |
| `high-carb`    | carbs ≥ 50 g       |
| `low-calorie`  | calories ≤ 400     |
| `low-fat`      | fat ≤ 10 g         |

Presets can be combined with each other (`preset=high-protein,low-calorie`) and with explicit filters; the stricter bound wins.

### Recipe responses

Every recipe includes:

- `savedCount`: how many meal plans use it (counted anonymously)
- `isSystem`: whether it is a default NutriPrep recipe
- `author`: `{ id, username }`. Emails are never exposed.

## Sharing: public and private

| | Recipes | Weekly meal plans |
| --- | --- | --- |
| Default | Public | Private |
| Share or hide | `PUT /api/recipes/:id/visibility` | `PUT /api/users/:id/mealplans/visibility` |
| Public listings | `GET /api/recipes`, `GET /api/recipes/popular` | `GET /api/mealplans/public` |
| Who sees private ones | The author and admins | The owner and admins |

```http
PUT /api/users/5/mealplans/visibility
Authorization: Bearer <access_token>
Content-Type: application/json

{ "isPublic": true }
```

- Private recipes return `404` to everyone except their author and admins, and they never appear in a shared plan.
- Any public recipe can be saved into a private plan. Nobody can see who saved it.
- **System recipes** are created by admins with `"isSystem": true`. They are always public, and only admins can set or remove the flag.
- Deleting a user also deletes their recipes, meal plans and refresh tokens.

## Responses and errors

Successful responses use a common envelope. Lists include pagination metadata:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

Errors return `{ "success": false, "message": "..." }`:

| Status | Meaning                                                        |
| ------ | -------------------------------------------------------------- |
| `400`  | Invalid request body or query parameter                        |
| `401`  | Missing, invalid or expired token                              |
| `403`  | Missing scope, or not the owner of the resource                |
| `404`  | Not found (also used for other users' private data)            |
| `409`  | Conflict, e.g. duplicate meal slot or deleting a used category |

The OAuth2 endpoints follow RFC 6749 and return `{ "error": "invalid_grant", "error_description": "..." }`. Protected routes send a `WWW-Authenticate` header as described in RFC 6750.

## Postman collection

[`postman/NutriPrep-API.postman_collection.json`](postman/NutriPrep-API.postman_collection.json) covers every endpoint, including error cases, with automated tests.

1. Import the file into Postman.
2. In the collection's **Variables**, set `adminEmail`, `adminPassword` and `serviceClientSecret` to the values in your `.env`.
3. Start the API (`npm run dev`) and run the whole collection with the **Collection Runner**. Requests pass tokens and ids to each other through collection variables, and the last folder deletes the data the run created.

Highlights:

- **2b. OAuth2**: password, refresh, client credentials and revoke flows, plus scope limits
- **7b. Security & Access Control**: rejected tampered and forged tokens, role-based scopes and ownership rules

Run it from the command line with [Newman](https://github.com/postmanlabs/newman):

```bash
npx newman run postman/NutriPrep-API.postman_collection.json \
  --env-var "adminEmail=<ADMIN_EMAIL>" \
  --env-var "adminPassword=<ADMIN_PASSWORD>" \
  --env-var "serviceClientSecret=<OAUTH_SERVICE_CLIENT_SECRET>"
```

## Project structure

```text
src/
  controllers/   HTTP request and response handlers
  errors/        AppError and OAuthError
  middleware/    Validation, authentication, authorization, error handling
  models/        Request and domain types, OAuth2 scopes
  routes/        Route definitions
  services/      Business logic and database queries
  types/         Express request typing
  utils/         JWT and Prisma helpers
  server.ts      Express app setup
  index.ts       Entry point
prisma/
  schema.prisma  Data model
  migrations/    Database migrations
  seed.ts        Admin user and OAuth2 clients
postman/         Postman collection
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the request flow and design decisions.
