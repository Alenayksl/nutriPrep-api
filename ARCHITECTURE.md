# NutriPrep API Architecture

The API is organized around the request flow:

`routes -> controllers -> services -> Prisma client -> PostgreSQL`

- `src/server.ts`: creates the Express application, loads dotenv, configures CORS and JSON parsing, registers REST routes, and returns JSON for health, test, and 404 responses.
- `src/index.ts`: validates `PORT` and starts the HTTP listener. Keeping this separate makes `createServer()` easy to test.
- `src/routes/`: maps HTTP methods and resource paths to controllers.
- `src/controllers/`: translates HTTP requests into service calls and formats JSON responses.
- `src/services/`: owns business rules, filtering, pagination, and Prisma queries.
- `src/middleware/`: shared concerns such as validation, error handling, JWT authentication, role authorization, and pagination parsing.
- `src/models/`: temporary domain types and fixtures. These can be replaced by Prisma-generated types as persistence is migrated.
- `prisma/`: PostgreSQL schema and migrations for `User`, `Recipe`, `Category`, and `MealPlan`.

## Roles

The Prisma `Role` enum is the source of truth: `GUEST`, `MEMBER`, and `ADMIN`. A future `authenticateJwt` middleware should attach the verified user to `req.user`; an `authorize(...roles)` middleware should then protect routes such as recipe administration and category management.

Suggested policy:

- `GUEST`: public read-only resources.
- `MEMBER`: authenticated recipe and meal-plan operations for the current user.
- `ADMIN`: user, category, and moderation operations.

## Filtering and pagination

Collection endpoints should accept query parameters such as `page`, `limit`, `search`, `categoryId`, and `isPublic`. Parse and clamp them in a reusable middleware or `services/query` helper, then pass a typed object to the service. Services should return a consistent envelope:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

This keeps controllers thin and allows the current in-memory services to be replaced by Prisma queries without changing the Next.js client contract.
