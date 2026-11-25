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

Authentication is exposed through `POST /api/auth/login` and `GET /api/auth/me`. JWT configuration is provided by `JWT_SECRET` (at least 32 characters) and `JWT_EXPIRES_IN` environment variables. Tokens are HS256, and verification pins the algorithm.

Authorization has two layers:

1. **Role**: `requireRole(...roles)` on routes, for example `ADMIN` for category writes and `MEMBER` for recipe writes.
2. **Ownership**: checked with the helpers in `src/middleware/authorization.ts` (`Actor`, `canAccessOwnedBy`, `assertCanAccessOwnedBy`). `ADMIN` passes every ownership check.
   - `/users/:id` routes use the `requireSelfOrAdmin` middleware.
   - Recipe and meal-plan services take the caller (`Actor`) and check the stored `authorId` / `userId` before updates and deletes.
   - `authorId` / `userId` in the request body default to the caller, and members cannot point them at another user.
   - Public recipe reads use `optionalAuthentication`, so a caller can see their own `isPublic: false` recipes and other users cannot.

Policy:

- `GUEST`: public read-only resources (anonymous requests are treated the same way).
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
