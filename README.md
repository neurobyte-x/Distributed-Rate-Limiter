# Distributed Rate Limiter

A production-style distributed rate limiter built with Spring Boot and Redis.
It supports multiple algorithms, scoped rules, and centralized enforcement for multi-instance deployments.

## Features

- Multiple algorithms:
	- `FIXED_WINDOW`
	- `SLIDING_WINDOW_LOG`
	- `SLIDING_WINDOW_COUNTER`
	- `TOKEN_BUCKET`
- Rule scopes:
	- `GLOBAL`
	- `USER`
	- `IP`
	- `ENDPOINT`
- Redis-backed storage for:
	- rate limit counters/state
	- rule persistence
- REST API for:
	- rule CRUD
	- request limit checks
- Validation and structured error responses
- Unit, controller, strategy, and integration tests
- Next.js web console for policy management, request simulation, and health monitoring

## Tech Stack

- Java 21
- Spring Boot 3.3.x
- Redis 7.x
- Maven
- Testcontainers (integration tests)
- Next.js 15 + React 19, TypeScript, Tailwind CSS v4, pnpm (console)

## Project Structure

```text
src/main/java/com/neurobyte/ratelimiter
	controller/     # REST controllers
	dto/            # Request/response DTOs
	exception/      # Global exception handling
	model/          # Domain models and enums
	repository/     # Rule repository (Redis implementation)
	service/        # Business services
	strategy/       # Rate limiting strategies and factory
	util/           # Key generation and DTO mapping
frontend/            # Next.js console (App Router, Tailwind, same-origin API proxy)
```

## Prerequisites

Choose one run mode:

1. Docker mode (recommended):
	 - Docker Desktop
2. Local mode:
	 - Java 21
	 - Maven 3.9+
	 - Redis 7+
	 - Node.js 22+ and pnpm 10+ (for the console)

## Quick Start (Docker Compose)

From the project root:

```bash
docker compose up --build
```

Services:

- Console: `http://localhost:3000`
- App: `http://localhost:8080`
- Redis: `localhost:6379`

Stop services:

```bash
docker compose down
```

To also remove persisted Redis volume:

```bash
docker compose down -v
```

## Web Console

The console is a Next.js app in `frontend/`. It covers rule CRUD and live limit checks,
including single-request evaluation breakdowns and burst tests.

When running the app without Docker:

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The console proxies `/api/*` to `BACKEND_URL`
(default `http://localhost:8080`) from the Next.js server, so no backend CORS
configuration is required. Set `BACKEND_URL` in `frontend/.env.local` to point at a
different backend, and restart the dev server.

See [`frontend/README.md`](frontend/README.md) for console features, scripts, and the
Docker build.

## Local Run (Without Docker for App)

1. Start Redis:

```bash
docker run --name distributed-rl-redis -p 6379:6379 redis:7.2-alpine
```

2. Run application:

```bash
mvn spring-boot:run
```

Or build and run jar:

```bash
mvn clean package
java -jar target/distributed-rate-limiter-1.0.0.jar
```

## Configuration

Environment variables:

- `SERVER_PORT` (default: `8080`)
- `REDIS_HOST` (default: `localhost`)
- `REDIS_PORT` (default: `6379`)
- `BACKEND_URL` (console only, default: `http://localhost:8080`)

Example:

```bash
REDIS_HOST=localhost REDIS_PORT=6379 SERVER_PORT=8080 mvn spring-boot:run
```

Windows PowerShell example:

```powershell
$env:REDIS_HOST="localhost"
$env:REDIS_PORT="6379"
$env:SERVER_PORT="8080"
mvn spring-boot:run
```

## API Reference

Base URL: `http://localhost:8080`

### 1) Create Rule

`POST /api/rules`

Example (fixed window, user-scoped):

```bash
curl -X POST http://localhost:8080/api/rules \
	-H "Content-Type: application/json" \
	-d '{
		"algorithmType": "FIXED_WINDOW",
		"limit": 5,
		"windowSizeSeconds": 60,
		"scopeType": "USER",
		"identifierValue": "user-123",
		"endpointPattern": "/api/payments",
		"enabled": true
	}'
```

Example (token bucket):

```bash
curl -X POST http://localhost:8080/api/rules \
	-H "Content-Type: application/json" \
	-d '{
		"algorithmType": "TOKEN_BUCKET",
		"scopeType": "IP",
		"identifierValue": "10.10.10.10",
		"refillRatePerSecond": 2.0,
		"burstCapacity": 10,
		"limit": 10,
		"windowSizeSeconds": 1,
		"endpointPattern": "/api/**",
		"enabled": true
	}'
```

`limit` and `windowSizeSeconds` are not used by the token bucket algorithm, but bean
validation requires both to be at least `1`, so send safe values with every token bucket
payload.

### 2) List Rules

`GET /api/rules`

### 3) Get Rule by ID

`GET /api/rules/{id}`

### 4) Update Rule

`PUT /api/rules/{id}`

Use the same payload shape as create.

### 5) Delete Rule

`DELETE /api/rules/{id}`

### 6) Check Rate Limit

`POST /api/rate-limit/check`

```bash
curl -X POST http://localhost:8080/api/rate-limit/check \
	-H "Content-Type: application/json" \
	-d '{
		"userId": "user-123",
		"ipAddress": "10.10.10.10",
		"endpoint": "/api/payments"
	}'
```

If allowed, API returns `200 OK`.
If blocked, API returns `429 Too Many Requests`.

## Health Endpoint

```bash
curl http://localhost:8080/actuator/health
```

## Running Tests

```bash
mvn test
```

Notes:

- Integration tests use Testcontainers and require Docker.
- If Docker is not running, integration tests can fail.

## Troubleshooting

- Connection refused to Redis:
	- Ensure Redis is running and `REDIS_HOST` / `REDIS_PORT` are correct.
- `mvn` command not found:
	- Install Maven and ensure it is on your `PATH`.
- Port already in use:
	- Change `SERVER_PORT` or stop the process using `8080`.
- Testcontainers failures:
	- Ensure Docker Desktop is running and accessible from your shell.

## Production Notes

- The project demonstrates algorithm behavior and distributed coordination via Redis.
- For production hardening, consider:
	- authentication/authorization on rule management endpoints
	- metrics/alerts and dashboarding
	- Redis HA setup and persistence policies
	- load tests and chaos testing

