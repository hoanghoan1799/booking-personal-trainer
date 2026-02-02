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
