# MLM Backend Service

A backend service for a multi-level marketing application, built with Node.js, Express, and TypeScript.

## Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## About The Project

This project provides the backend infrastructure for a Multi-Level Marketing (MLM) platform. It includes services for managing user accounts, processing commissions, handling wallets, and much more. It is designed to be scalable and maintainable, using a modern technology stack.

## Key Features

- **User Management**: Secure user registration, authentication, and profile management.
- **Referral System**: Track and manage user referrals and network hierarchy.
- **Commission Processing**: Calculate and disburse commissions based on sales and network performance.
- **E-wallet**: Manage user wallets, including deposits, withdrawals, and transfers.
- **Product and Order Management**: Handle product catalogs, sales, and order processing.
- **Real-time Chat**: Integrated chat functionality for user communication.
- **Admin Dashboard**: A comprehensive admin interface for managing the platform.
- **Background Jobs**: Utilizes queues and workers for handling long-running tasks like sending emails and processing bonuses.

## Technologies Used

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JSON Web Tokens (JWT)
- **Caching**: Redis, Node Cache
- **Real-time Communication**: Ably
- **File Storage**: AWS S3 (or compatible like Cloudflare R2)
- **Queues**: BullMQ for background job processing
- **Email**: Resend
- **SMS**: Custom SMS integration
- **Deployment**: Docker, PM2
- **Linting & Formatting**: ESLint, Prettier

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- pnpm (or npm/yarn)
- Docker and Docker Compose

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/mlm-backend.git
   cd mlm-backend
   ```

2. **Install dependencies:**
   ```sh
   pnpm install
   ```

### Environment Configuration

1. **Create a `.env` file** by copying the example file:
   ```sh
   cp .env.example .env
   ```

2. **Update the `.env` file** with your configuration for the database, Redis, JWT secret, and other services.

### Database Setup

1. **Start the database and Redis containers:**
   ```sh
   docker-compose up -d
   ```

2. **Run the database migrations:**
   ```sh
   pnpm db:migrate
   ```

3. **Seed the database with initial data (optional):**
   ```sh
   pnpm db:seed-admin
   pnpm db:seed-packages
   # ... and other seed scripts
   ```

## Available Scripts

- `pnpm dev`: Start the development server with hot-reloading.
- `pnpm build`: Build the project for production.
- `pnpm start`: Start the production server.
- `pnpm worker:start`: Start the background workers using PM2.
- `pnpm db:migrate`: Apply database migrations.
- `pnpm lint`: Lint the codebase.
- `pnpm format`: Format the codebase.

## Project Structure

The project follows a feature-based structure:

```
src/
├── cli/          # Command-line interface scripts
├── common/       # Shared constants, schemas, and utilities
├── config/       # Application configuration
├── core/         # Core classes and repositories
├── db/           # Database client and generated types
├── features/     # Main application features (modules)
├── jobs/         # Job definitions for background tasks
├── lib/          # External library initializations
├── middlewares/  # Express middlewares
├── queues/       # Queue definitions
├── routes/       # API routes
├── workers/      # Background workers
└── server.ts     # Main application entry point
```

## API Documentation

API documentation can be generated or is available at a separate URL (e.g., using Postman or Swagger).

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the ISC License. See `LICENSE` for more information.