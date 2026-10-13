# NutriPrep API Architecture

The API is organized around the request flow:

`routes -> controllers -> services -> Prisma client -> PostgreSQL`

- `src/server.ts`: creates the Express application, loads dotenv, configures CORS and JSON parsing, registers REST routes, and returns JSON for health, test, and 404 responses.
- `src/index.ts`: validates `PORT` and starts the HTTP listener. Keeping this separate makes `createServer()` easy to test.
- `src/routes/`: maps HTTP methods and resource paths to controllers.
- `src/controllers/`: translates HTTP requests into service calls and formats JSON responses.
- `src/services/`: owns business rules, filtering, pagination, and Prisma queries.
- `src/middleware/`: shared concerns such as validation, error handling, JWT authentication, role authorization, and pagination parsing. Category creation is protected by `requireRole(Role.ADMIN)`.
- `src/utils/jwt.ts`: signs and verifies JWTs using the authenticated user's ID and Prisma role.
- `src/services/authService.ts`: verifies bcrypt passwords and creates login tokens.
- `src/utils/prisma.ts`: owns the singleton `PrismaClient` instance used by database-backed services.
- `src/models/`: request and domain input types. All four core entity services now use Prisma persistence.
- `src/services/userService.ts`: manages User CRUD with bcrypt password hashing and public response sanitization; passwords are never returned.
- `prisma/`: PostgreSQL schema and migrations for `User`, `Recipe`, `Category`, and `MealPlan`.

## Roles

The Prisma `Role` enum is the source of truth: `GUEST`, `MEMBER`, and `ADMIN`. `authenticateToken` verifies `Authorization: Bearer <token>` and attaches the verified user to `req.user`; `requireRole(...roles)` then protects routes such as category creation.

Authentication is exposed through `POST /api/auth/login`. JWT configuration is provided by `JWT_SECRET` and `JWT_EXPIRES_IN` environment variables.

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

This keeps controllers thin and allows Prisma queries to evolve without changing the Next.js client contract.
