# Throttle · Rate Limiter Console

A Next.js control plane for the Spring Boot + Redis distributed rate limiter. It manages
policies, simulates single requests and bursts against the live limiter, and reports the
health of the backend and Redis.

## Highlights

- **Overview** — live policy counts, session check stats, quick request check, Redis/service
  health with a probe-latency sparkline, and a per-session activity feed.
- **Rules** — searchable/filterable policy table with inline enable toggles, full create/edit
  forms, duplicate and delete flows, endpoint/scope presets, and live policy previews.
- **Playground** — send a request context through `POST /api/rate-limit/check`, inspect every
  rule evaluation, replay recent contexts, and run burst tests with a timeline and remaining
  quota chart.
- **System** — dependency health, raw Actuator payload, copyable `curl` examples, and the API
  reference for the endpoints the console consumes.

The UI ships with a dark theme by default and a light theme toggle. Session activity is kept
in the browser (`sessionStorage`); rules and counters stay in Redis via the backend.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- pnpm
- lucide-react icons, Geist fonts
- Hand-rolled UI primitives (no component library runtime)

## Run Locally

The console expects the backend on `http://localhost:8080` by default.

```bash
# from the repository root
docker compose up -d redis   # or any Redis on localhost:6379
mvn spring-boot:run          # backend on :8080

# in another terminal
cd frontend
pnpm install
pnpm dev                     # console on http://localhost:3000
```

Point the console at a different backend by creating `frontend/.env.local`:

```bash
BACKEND_URL=http://localhost:8080
```

Restart the dev server after changing `BACKEND_URL`.

## API Proxy (no CORS setup)

All browser calls go to same-origin `/api/*` routes and are forwarded server-side:

- `src/app/api/[...path]/route.ts` proxies `BACKEND_URL/api/*`
- `src/app/api/health/route.ts` proxies `BACKEND_URL/actuator/health`

That keeps the backend unchanged and avoids browser CORS. Requests preserve the backend's
status code (including `429 Too Many Requests`) and surface validation errors in the UI.

Because the proxy runs on the Next.js server, use a URL the server can reach: for Docker
Compose that is `http://app:8080`, not `localhost`.

## Scripts

| Command          | Description                                  |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Start the dev server on port 3000            |
| `pnpm build`     | Production build                             |
| `pnpm start`     | Serve the production build                   |
| `pnpm typecheck` | TypeScript type checking (`tsc --noEmit`)    |

## Docker

The root `docker-compose.yml` builds this app and runs it alongside Redis and the backend:

```bash
docker compose up --build
```

- Console: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Redis: `localhost:6379`

The image uses Next.js standalone output. Standalone is opt-in (`NEXT_OUTPUT=standalone`)
because copying pnpm's symlinked store into `.next/standalone` can fail on Windows hosts;
the Dockerfile enables it for the Linux build.

## Project Layout

```text
src/app/            App Router pages, global styles, API proxy routes
src/components/     App shell, sidebar/topbar, UI primitives, and page sections
src/providers/      Theme, toast, health polling, rules, and session activity state
src/lib/            API client, types, formatting helpers, rule metadata
```

## Notes

- `identifierValue` is required for `USER`, `IP`, and `ENDPOINT` scopes and hidden for `GLOBAL`.
- The backend validates `limit` and `windowSizeSeconds` even for `TOKEN_BUCKET` rules, so the
  form always sends safe values (defaults `10` / `60`) alongside `refillRatePerSecond` and
  `burstCapacity`.
- A `remaining` value of `9223372036854775807` is displayed as `∞` (no matching limit).
