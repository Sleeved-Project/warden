# Warden - Authentication Microservice

A lightweight authentication microservice built with AdonisJS v6 and TypeScript for the Sleeved project ecosystem.

## Overview

Warden provides token-based authentication services:

- User registration and authentication
- Access token generation and validation
- User management

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

4. The service is now available at http://localhost:8010

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
