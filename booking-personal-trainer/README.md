# Nest.js Booking Personal Trainer

## Overview

This application is a fitness training platform that connects trainees with trainers while providing administrators with full system oversight. The system supports secure user authentication, role-based access control, training schedule management, and workout progress tracking.

Users can register and authenticate using a token-based authentication mechanism with short-lived access tokens and long-lived refresh tokens. The platform distinguishes between different user roles (ADMIN, TRAINER, TRAINEE) and user types (TRAINER, TRAINEE), with an approval workflow required for trainer accounts before they become fully active.

Trainees can browse available trainers, book training sessions, and participate in workouts assigned by trainers. Trainers can manage their bookings, create and track workouts, and monitor trainee progress. Administrators have access to all users, bookings, and workouts, enabling them to manage roles, approve trainers, and oversee platform activity.

The system is designed with clear separation between authentication, scheduling, and workout management, ensuring scalability, maintainability, and flexibility for future feature expansion.

## Tech Stack

- Runtime: Node.js
- Language: TypeScript
- Framework: Nest.js
- Authentication: Passport.JS (JWT)
- Database: PostgreSQL
- ORM: MikroORM
- API Documentation: Swagger / OpenAPI

## Features

- User authentication & Authorization (JWT-based access)
- Admin module
- User profile module

### Get source code

- Clone the project with:

```bash
git clone git@gitlab.asoft-python.com:hoan.hoang/nestjs-training.git
```

- Create `.env` into root of project source code, refer `.env.sample` to define environment variables for the project and test

### Install Dependencies and run the app

Navigate to the project directory:

```bash
cd booking-personal-trainer

# Development
pnpm start

# Watch mode
pnpm start:dev

# Production mode
pnpm start:prod
```

Run app using Docker Compose:

```bash
docker compose up --build
```


### Testing

- Run test: pnpm test
- Run test with coverage: pnpm test:cov

#### End-to-end tests

Run the full HTTP stack (see `src/test/jest-e2e.json` and `src/test/e2e/`):

```bash
cd booking-personal-trainer
pnpm test:e2e
```

E2E tests load environment from a dedicated `.test.env` file (see `src/test/e2e-setup-env.ts`). Create it by copying `.test.env.sample` and filling values. You need a reachable **PostgreSQL** (migrations are applied by `createTestApp` via `migrator.up()`) and **Redis** (BullMQ in `AppModule` opens a real connection; rate-limiting and cache behavior depend on the scenario). The default API e2e app swaps in an in-memory cache and mocked Redis service clients, but Bull still uses `REDIS_HOST` / `REDIS_PORT` from the environment. Set at least: `POSTGRES_*`, `JWT_SECRET`, and Redis host/port.

Teardown in `teardownTestApp` closes the email Bull `Queue` and the MikroORM connection. The email queue is registered with `forceDisconnectOnShutdown: true` so Bull disconnects from Redis on app shutdown.

Jest is configured with `forceExit: true` in `src/test/jest-e2e.json` so the process always exits on time. You may see a line: `Force exiting Jest: ...` at the end — **that is not a test failure**; it is Jest noting that it chose to exit while some integration (Redis, Bull, or similar) may still be winding down. If you need to find remaining open handles, run: `pnpm exec jest --config ./src/test/jest-e2e.json --detectOpenHandles --runInBand` (and consider removing `forceExit` only while debugging).
