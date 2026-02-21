# Repository Overview: Express.js & TypeScript Template

This document outlines the structure, operational flow, and conventions of this Express.js and TypeScript template repository.

## 1. Repository Structure

The project is organized into several key directories:

-   **`.git/`**: Git version control metadata.
-   **`src/`**: The core application source code.
    -   **`common/`**: Shared utilities, constants, and schemas.
        -   `constants/`: Application-wide constants (cache, email, error codes, etc.).
        -   `schema/`: Validation schemas (e.g., `authValidator.ts`).
        -   `utils/`: General utility functions (auth, cookie, date, errors, logger, etc.).
    -   **`db/`**: Database client and types.
        -   `db-client.ts`: Initializes and exports the database client (likely Prisma).
        -   `types.ts`: Custom database-related types.
    -   **`jobs/`**: Definitions for background jobs.
    -   **`lib/`**: Third-party library wrappers or custom library implementations (e.g., `hash.ts`, `jwt.ts`, `redis.ts`).
    -   **`middlewares/`**: Express.js middleware functions.
        -   `authentication.ts`, `error-handler.ts`, `rate-limiter.ts`, `validator.ts`: Common middleware.
    -   **`modules/`**: Feature-specific modules, following a modular architecture.
        -   Each module (e.g., `account/`, `auth/`) typically contains:
            -   `*.controller.ts`: Handles incoming requests and sends responses.
            -   `*.repository.ts`: Interacts with the database.
            -   `*.route.ts`: Defines API routes for the module.
            -   `*.service.ts`: Contains business logic.
    -   **`queues/`**: Queue definitions (likely for background job processing).
    -   **`routes/`**: Main API route definitions.
        -   `api.ts`: Aggregates routes from different modules.
    -   **`server.ts`**: The main entry point for the Express.js application.
    -   **`workers/`**: Worker processes (likely for handling jobs from queues).

## 2. How it Works

This repository provides a robust template for building RESTful APIs with Express.js and TypeScript.

-   **Entry Point**: The application starts with `src/server.ts`, which sets up the Express.js server, connects to the database, and registers middleware and routes.
-   **Configuration**: Environment variables are managed via `.env.example` and loaded through `src/config/env.ts`. Other configurations are centralized in `src/config/`.
-   **Database Interaction**: Prisma is used as the ORM, with its schema defined in `prisma/schema.prisma`. Database operations are encapsulated within `*.repository.ts` files.
-   **API Structure**: The API follows a modular pattern, where each feature (e.g., `auth`, `account`) has its own `controller`, `service`, `repository`, and `route` files.
-   **Request Flow**:
    1.  Requests hit `src/server.ts`.
    2.  Middleware in `src/middlewares/` processes requests (e.g., authentication, validation, error handling).
    3.  Requests are routed by `src/routes/api.ts` to the appropriate module's `*.route.ts`.
    4.  The `*.controller.ts` handles the request, delegates business logic to `*.service.ts`, which in turn uses `*.repository.ts` for database interactions.
    5.  Responses are sent back through the middleware chain.
-   **Background Processing**: The project integrates with Redis (`src/lib/redis.ts`, `src/config/redis.ts`) and includes `src/jobs/`, `src/queues/`, and `src/workers/` for handling background tasks and asynchronous operations.

## 3. Conventions

### 3.1. Naming Conventions

-   **Files**: `kebab-case` for file names (e.g., `account.controller.ts`).
-   **Folders**: `kebab-case` for folder names (e.g., `account/`).
-   **Classes/Interfaces/Types**: `PascalCase`.
-   **Functions/Variables**: `camelCase`.
-   **Constants**: `UPPER_SNAKE_CASE` (especially in `src/common/constants/`).

### 3.2. Code Style & Formatting

-   **TypeScript**: Adheres to strict TypeScript practices, as configured in `tsconfig.json`.
-   **ESLint**: Code linting is enforced using `.eslintrc.js` to maintain code quality and consistency.
-   **Prettier**: Code formatting is managed by `.prettierrc` and `.prettierrc.json` to ensure consistent code style across the project.

### 3.3. Architecture

-   **Modular Design**: Features are organized into independent modules (`src/modules/`) to promote separation of concerns and maintainability.
-   **Layered Architecture**: Clear distinction between controllers (request handling), services (business logic), and repositories (data access).
-   **Error Handling**: Centralized error handling via `src/middlewares/error-handler.ts` and custom error classes in `src/common/utils/errors.ts`.

### 3.4. Dependencies

-   **Package Manager**: `pnpm` is used for dependency management, indicated by `pnpm-lock.yaml`.
-   **Prisma**: Used for ORM and database migrations.
-   **Redis**: Used for caching and queue management.

### 3.5. Environment Variables

-   Environment variables are used for sensitive information and configuration that varies between environments. Refer to `.env.example` for required variables.

### 3.6. Git

-   `.gitignore` specifies files and directories that should not be tracked by Git.

This template aims to provide a clear, scalable, and maintainable foundation for your Express.js and TypeScript projects.
