# 🚀 Express.js + TypeScript API Template

A scalable, modular, and production-ready Express.js + TypeScript backend template.

This repository provides a clean architecture foundation with Prisma ORM, Redis integration, background job processing, and strict TypeScript standards.

Built with:

- Express.js
- TypeScript (strict mode)
- Kysely (type-safe SQL query builder)
- Knex (migration tool)
- Redis (caching & queues)
- pnpm
- ESLint + Prettier

---

# 📦 Tech Stack

| Tool | Purpose |
|------|---------|
| Express | HTTP server |
| TypeScript | Type safety |
| Kysely | Type-safe SQL query builder |
| Knex | Database migrations |
| Redis | Cache & job queues |
| pnpm | Package manager |


# 🏗 Repository Structure

```
src/
├── common/
│   ├── constants/      # Application constants
│   ├── schema/         # Validation schemas
│   └── utils/          # Utility functions
│
├── config/             # Configuration files
├── db/                 # Database client & types
├── jobs/               # Background job definitions
├── lib/                # Library wrappers
├── middlewares/        # Express middleware
├── modules/            # Feature modules
│   ├── auth/
│   ├── account/
│   └── ...
├── queues/             # Queue definitions
├── routes/             # API routes
├── server.ts           # Application entry point
└── workers/            # Worker processes
```

---

# 🧠 Architecture Overview

This template follows a **modular + layered architecture**.

```
module/
├── module.controller.ts
├── module.service.ts
├── module.repository.ts
└── module.route.ts
```

## Layered Pattern

Each feature module follows this structure:


### Responsibilities

| Layer        | Responsibility |
|--------------|---------------|
| Controller   | Handles HTTP request/response |
| Service      | Business logic |
| Repository   | Database interaction |
| Route        | Express route definitions |

---

# 🔄 Request Lifecycle

1. Request enters `server.ts`
2. Global middleware executes (auth, rate limiter, validator, etc.)
3. Routed via `routes/api.ts`
4. Controller receives request
5. Service processes business logic
6. Repository communicates with database
7. Response returns through middleware chain

---

# 🗄 Database Layer

- Prisma ORM
- Schema defined in: `prisma/schema.prisma`
- Client initialized in: `src/db/db-client.ts`
- Custom DB types in: `src/db/types.ts`

All database access must go through repository files.

---

# ⚙ Background Processing

Redis-backed job system:

- `src/queues/` – Queue definitions
- `src/jobs/` – Job logic
- `src/workers/` – Worker processors
- `src/lib/redis.ts` – Redis client wrapper

Designed for:
- Email sending
- Notifications
- Heavy async tasks
- Scheduled jobs

---

# 🧩 Middleware

Located in `src/middlewares/`

Includes:

- Authentication
- Rate Limiter
- Request Validator
- Centralized Error Handler

---

# 🧾 Conventions

## Naming

| Type | Convention |
|------|------------|
| Files | kebab-case |
| Folders | kebab-case |
| Classes | PascalCase |
| Functions | camelCase |
| Constants | UPPER_SNAKE_CASE |

---

## Code Quality

- Strict TypeScript
- ESLint enforced
- Prettier formatting
- Consistent modular structure

---

# 🔐 Environment Variables

Environment variables are required for:

- Database connection
- Redis connection
- JWT secrets
- API configuration

