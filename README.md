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

Never commit `.env`. Use `.env.example` as the configuration template.

## Scripts

```bash
npm run dev              # Start the TypeScript development server
npm run build            # Compile TypeScript to dist/
npm start                # Start the compiled server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:seed      # Create or update the admin user
```

## Authentication

Register a user:

```http
POST /api/users/register
Content-Type: application/json

{
  "username": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "strong-password"
}
```

Login:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ada@example.com",
  "password": "strong-password"
}
```

Use the returned token on protected requests:

```http
Authorization: Bearer <token>
```

Passwords are stored as bcrypt hashes and are never returned by the API. New users receive the Prisma default `MEMBER` role.

## API Routes

### Public Routes

| Method | Route                 | Description             |
| ------ | --------------------- | ----------------------- |
| `GET`  | `/api/health`         | Health check            |
| `GET`  | `/api/test`           | Test endpoint           |
| `POST` | `/api/auth/login`     | Login and receive a JWT |
| `POST` | `/api/users/register` | Register a member       |
| `GET`  | `/api/categories`     | List categories         |
| `GET`  | `/api/categories/:id` | Read a category         |
| `GET`  | `/api/recipes`        | List recipes            |
| `GET`  | `/api/recipes/:id`    | Read a recipe           |

### Protected Routes

All protected routes require `Authorization: Bearer <token>`.

| Method                         | Route                      | Required role       |
| ------------------------------ | -------------------------- | ------------------- |
| `POST`, `PUT`, `DELETE`        | `/api/categories`          | `ADMIN`             |
| `POST`, `PUT`, `DELETE`        | `/api/recipes`             | `MEMBER` or `ADMIN` |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/mealplans`           | Authenticated user  |
| `GET`                          | `/api/users/:id`           | Authenticated user  |
| `PUT`, `DELETE`                | `/api/users/:id`           | Authenticated user  |
| `GET`                          | `/api/users/:id/dashboard` | Authenticated user  |

## Filtering and Pagination

Recipe listing supports:

```http
GET /api/recipes?page=1&limit=20&categoryId=1&minProtein=20&maxCalories=600
```

Meal plan listing supports:

```http
GET /api/mealplans?page=1&limit=20&userId=1&dayOfWeek=Monday&mealType=Lunch
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

`postman/NutriPrep-API.postman_collection.json` contains requests for every API method, including error cases (400, 401, 403, 404). Import it into Postman and run it with the Collection Runner: requests save `token`, `adminToken`, `userId`, `categoryId`, `recipeId` and `mealPlanId` into collection variables, and the last folder deletes the created data.

It can also be run from the command line:

```bash
npx newman run postman/NutriPrep-API.postman_collection.json
```

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
