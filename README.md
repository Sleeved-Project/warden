# Warden - Authentication Microservice

A lightweight authentication microservice built with AdonisJS v6 and TypeScript for the Sleeved project ecosystem.

## Overview

Warden provides token-based authentication services:

- User registration and email verification (with 6-digit code)
- Access token generation and validation (Bearer tokens)
- User login (only after email verification)
- User info retrieval (`/api/v1/me`)
- Email resend for verification

**Implementation to come :**

- Refresh token flow
- password reset flow
- OAuth (Google, etc.) flow

## 📚 Documentation

- **Swagger:** [http://localhost:8081/docs](http://localhost:8081/docs)
- **Authentication Flow (Mermaid diagram):** [https://sleeved.atlassian.net/wiki/x/A4DoAQ](https://sleeved.atlassian.net/wiki/x/A4DoAQ)

## Prerequisites

- Docker and Docker Compose
- Node.js v22+ (for local development only)

## Running with Docker

1. Create .env file

```bash
cp .env.example .env
```

2. Build container

```bash
docker-compose build
```

3. Start the containers

```bash
docker-compose up -d
```

4. The service is now available at http://localhost:8081

## Task Commands Reference

This project uses [Task](https://taskfile.dev/) for managing development workflows. Below are the available commands:

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `task build`        | Build the services                  |
| `task start`        | Start the services                  |
| `task stop`         | Stop the services                   |
| `task restart`      | Restart all services                |
| `task rebuild`      | Stop, rebuild, and restart services |
| `task logs`         | View application logs               |
| `task shell`        | Open a shell in the app container   |
| `task db:migrate`   | Run database migrations             |
| `task db:rollback`  | Rollback migrations                 |
| `task db:migration` | Create a new migration              |
| `task db:seed`      | Run database seeders                |
| `task test`         | Run tests                           |
| `task lint`         | Run linting                         |
| `task format`       | Format code                         |

## Integrating Warden with a Sleeved Project

To use Warden as your authentication provider in another Sleeved API service:

1. When a user logs in or registers (and verifies their email), your service receives a Bearer token from Warden.

2. For each protected route in your API, require clients to send the Bearer token in the `Authorization` header.

3. On each request to a protected route, your service must call Warden's `/api/v1/me` endpoint with the received token in the header `Authorization: Bearer <token>`.
   - If Warden returns HTTP 200 and user info, the token is valid and you can authorize the request.
   - If Warden returns HTTP 401, reject the request (invalid or expired token).

4. Use the user info returned by `/me` to implement any role-based access or permissions needed in your service.

5. If `/me` returns 401, respond with an authentication error and ask the client to re-authenticate.

**Note:**

- Always keep the Warden service URL and port up to date with your deployment (e.g., `http://warden-api:8081/api/v1/me` in Docker, or `http://localhost:8081/api/v1/me` in local dev).
- This integration pattern is backend-to-backend and does not concern frontend logic.

## Code Quality Tools

### Husky

This project uses Husky to enforce code quality via pre-commit hooks. Husky automatically runs checks before each commit to ensure all code meets the project's quality standards.

#### Why We Use Husky

- Prevents committing code that doesn't meet standards
- Maintains consistent code quality across the team
- Reduces errors in production by catching issues early

#### Pre-commit Checks

- Code formatting (Prettier)
- Linting (ESLint)
- TypeScript type checking

### Formatting and Linting

Maintain code quality by running:

```bash
# Format code with Prettier
npm run format

# Check formatting without making changes
npm run format:check

# Run ESLint to find code issues
npm run lint

# Run TypeScript type checking
npm run typecheck

# Run all checks at once
npm run check
```

## Roadmap / TODO

- [x] User registration with email verification code
- [x] Login with email/password (only if verified)
- [x] Resend verification code
- [x] Access token (Bearer) generation
- [x] User info endpoint (`/api/v1/me`)
- [ ] Refresh token flow
- [ ] Password reset flow
- [ ] OAuth Google login
- [ ] Account lockout/throttling
