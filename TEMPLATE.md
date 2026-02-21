# Repository Overview: Express.js & TypeScript Template

This document outlines the structure, operational flow, and conventions of this Express.js and TypeScript template repository.

---

## 1. Repository Structure

The project is organized into several key directories:

- **`.git/`**: Git version control metadata.
- **`src/`**: The core application source code.
  - **`common/`**: Shared utilities, constants, and schemas.
    - `constants/`: Application-wide constants (cache, email, error codes, etc.).
    - `schema/`: Validation schemas (e.g., `authValidator.ts`).
    - `utils/`: General utility functions (auth, cookie, date, errors, logger, etc.).
  - **`db/`**: Database client, configuration, and types.
    - `db-client.ts`: Initializes and exports the Kysely database instance.
    - `types.ts`: Database table typings used by Kysely.
  - **`database/migrations/`**: Database migration files managed by Knex.
  - **`jobs/`**: Definitions for background jobs.
  - **`lib/`**: Third-party library wrappers or custom implementations (e.g., `hash.ts`, `jwt.ts`, `redis.ts`).
  - **`middlewares/`**: Express.js middleware functions.
    - `authentication.ts`, `error-handler.ts`, `rate-limiter.ts`, `validator.ts`: Common middleware.
  - **`modules/`**: Feature-specific modules, following a modular architecture.
    - Each module (e.g., `account/`, `auth/`) typically contains:
      - `*.controller.ts`: Handles incoming requests and sends responses.
      - `*.repository.ts`: Interacts with the database using Kysely.
      - `*.route.ts`: Defines API routes for the module.
      - `*.service.ts`: Contains business logic.
  - **`queues/`**: Queue definitions (likely for background job processing).
  - **`routes/`**: Main API route definitions.
    - `api.ts`: Aggregates routes from different modules.
  - **`server.ts`**: The main entry point for the Express.js application.
  - **`workers/`**: Worker processes (likely for handling jobs from queues).
- **`knexfile.ts`**: Knex configuration file for managing migrations.

---

## 2. How it Works

This repository provides a robust template for building RESTful APIs with Express.js and TypeScript.

### Entry Point

The application starts with `src/server.ts`, which sets up the Express.js server, connects to the database, and registers middleware and routes.

### Configuration

Environment variables are managed via `.env.example` and loaded through `src/config/env.ts`. Other configurations are centralized in `src/config/`.

### Database Interaction

- **Kysely** is used as the type-safe query builder / ORM.
- **Knex** is used strictly for managing database migrations.
- Database operations are encapsulated within `*.repository.ts` files.
- All queries are written using Kysely to ensure strong typing and better maintainability.

### API Structure

The API follows a modular pattern, where each feature (e.g., `auth`, `account`) has its own `controller`, `service`, `repository`, and `route` files.

### Request Flow

1. Requests hit `src/server.ts`.
2. Middleware in `src/middlewares/` processes requests (e.g., authentication, validation, error handling).
3. Requests are routed by `src/routes/api.ts` to the appropriate module's `*.route.ts`.
4. The `*.controller.ts` handles the request, delegates business logic to `*.service.ts`.
5. The `*.service.ts` calls the `*.repository.ts` which interacts with the database using Kysely.
6. Responses are sent back through the middleware chain.

### Background Processing

The project integrates with Redis (`src/lib/redis.ts`, `src/config/redis.ts`) and includes `src/jobs/`, `src/queues/`, and `src/workers/` for handling background tasks and asynchronous operations.

---

## 3. Conventions

### 3.1. Naming Conventions

- **Files**: `kebab-case` for file names (e.g., `account.controller.ts`).
- **Folders**: `kebab-case` for folder names (e.g., `account/`).
- **Classes/Interfaces/Types**: `PascalCase`.
- **Functions/Variables**: `camelCase`.
- **Constants**: `UPPER_SNAKE_CASE` (especially in `src/common/constants/`).

---

### 3.2. Code Style & Formatting

- **TypeScript**: Strict TypeScript configuration is enforced via `tsconfig.json`.
- **ESLint**: Code linting is enforced using `.eslintrc.js`.
- **Prettier**: Code formatting is managed by `.prettierrc`.

---

### 3.3. Architecture

- **Modular Design**: Features are organized into independent modules (`src/modules/`) to promote separation of concerns and maintainability.
- **Layered Architecture**:
  - Controller → Service → Repository → Database
- **Error Handling**: Centralized error handling via `src/middlewares/error-handler.ts` and custom error classes in `src/common/utils/errors.ts`.

---

### 3.4. Database Migration Naming Convention (Knex)

To maintain clarity, traceability, and consistency across database changes, all migration files must follow a structured naming convention.

#### Format

```
{prefix}_{column_name_or_change_description}
```

#### Rules

- Use `snake_case`.
- Keep the name concise but descriptive.
- `{prefix}` indicates the type of schema change.
- One logical schema change per migration file.
- Do not group unrelated changes in a single migration.

#### Allowed Prefixes

- `add` — Adding a new column  
- `remove` — Removing a column  
- `update` — Modifying column type or constraints  
- `rename` — Renaming a column  
- `create` — Creating a new table  
- `drop` — Dropping a table  
- `index` — Adding an index  
- `unique` — Adding a unique constraint  
- `fk` — Adding a foreign key  

#### Examples

```
add_phone_number
remove_middle_name
update_email_nullable
rename_username_to_handle
create_user_profiles
drop_legacy_sessions
index_user_email
unique_order_reference
fk_user_id_accounts
```

#### Best Practices

- Avoid vague names like `update_user_table`.
- Migration name must clearly reflect the schema change.
- Keep naming consistent across the team.
- Always review generated SQL before running in production.

---

### 3.5. Dependencies

- **Package Manager**: `pnpm` is used for dependency management.
- **Knex**: Used for database migrations.
- **Kysely**: Used as the type-safe query builder / ORM.
- **Redis**: Used for caching and queue management.

---

### 3.6. Environment Variables

- Environment variables are used for sensitive information and configuration that varies between environments.
- Refer to `.env.example` for required variables.

---

### 3.7. Git

- `.gitignore` specifies files and directories that should not be tracked by Git.

---

This template aims to provide a clear, scalable, and maintainable foundation for your Express.js and TypeScript projects using Knex and Kysely.