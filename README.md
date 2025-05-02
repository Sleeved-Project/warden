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

4. The service is now available at http://localhost:3310
