# HACKBASE

React/Vite frontend and Hono/TypeScript backend foundation for hackathon-speed web app development.

## Documentation

- [Docs index](./docs/README.md)
- [Architecture](./docs/architecture.md)
- [Development Guide](./docs/development.md)
- [API Guide](./docs/api-guide.md)
- [WebSocket Guide](./docs/websocket.md)
- [Environment Variables](./docs/environment.md)
- [Supabase](./docs/supabase.md)
- [Fly.io Deploy](./docs/deploy-fly.md)
- [Agent Guide](./docs/agent-guide.md)

AI coding agents should also read [AGENTS.md](./AGENTS.md).

## Architecture

```text
.
├── frontend/              React + JavaScript + Vite + Tailwind CSS
├── backend/               Hono + TypeScript API server
│   └── src/
│       ├── routes/        URL and method registration
│       ├── handlers/      HTTP request/response conversion
│       ├── services/      Business logic and use cases
│       ├── repositories/  Supabase access
│       ├── external/      AI and third-party service adapters
│       ├── ws/            WebSocket handlers
│       ├── db/            Supabase client
│       └── config/        Environment configuration
├── openapi/               OpenAPI first API contract
├── supabase/              Supabase SQL migrations
├── docs/                  Development documentation
├── docker-compose.yml     App services
├── Makefile               Common development commands
└── .env.example           Shared local environment template
```

Backend request flow:

```text
Route -> Handler -> Service -> Repository -> Database
```

External AI services should live under `backend/src/external` or as dedicated services under `backend/src/services` when they become part of application use cases.

## Quick Start

```bash
make setup
# Edit .env and set SUPABASE_URL / SUPABASE_* keys.
make dev-backend
make dev-frontend
```

Docker only:

```bash
make docker-up
```

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8787/health
- Swagger UI: http://localhost:8787/docs
- WebSocket: ws://localhost:8787/ws

## Commands

```bash
make install        # install frontend and backend dependencies
make dev-backend   # start Hono backend
make dev-frontend  # start Vite frontend
make docker-up     # build and start frontend and backend
make docker-build  # build Docker images
make build         # build backend and frontend
make lint          # backend typecheck and frontend eslint
make test          # run backend unit tests
make openapi-check # validate required OpenAPI shape
make smoke-api     # run API smoke test against the running backend
make fly-deploy    # deploy backend to Fly.io from local machine
make down          # stop containers
make clean         # stop containers and remove volumes
```

## OpenAPI First

`openapi/openapi.yaml` is the API contract source of truth. Add or change the contract first, then implement the matching route, handler, service, and repository.

The backend serves the contract at `/openapi.json` and Swagger UI at `/docs`.

## Why This Structure

The frontend and backend are separated so each can evolve independently. The backend keeps a simple layered architecture because it gives clear responsibility boundaries without introducing framework-heavy patterns.

Compared with a single full-stack framework, this setup has a little more wiring, but it makes REST, WebSocket, Supabase, and future AI services explicit. Compared with a large clean architecture template, this is faster to understand and easier to change during a hackathon.

## Pros

- Clear place to add new API endpoints
- OpenAPI contract is visible from day one
- Supabase is the primary database/auth platform
- WebSocket support is included without affecting REST routes
- AI and third-party services can be added without mixing them into route code
- Minimal abstractions keep the code approachable

## Cons

- OpenAPI and implementation are not yet automatically diffed
- SQL migrations are tracked, but no migration runner is included yet
- Backend service unit tests are available with Node's built-in test runner
- Supabase credentials must be prepared in `.env` before the backend can connect

## Library Choices

- `hono`: small, fast backend framework with good TypeScript support
- `@hono/node-server`: runs Hono on Node.js for local and container-friendly deployment
- `@hono/node-ws`: adds WebSocket upgrade support for Node
- `@hono/swagger-ui`: serves Swagger UI directly from the backend
- `@supabase/server`: server-side Supabase auth/client utilities
- `@supabase/supabase-js`: Supabase client used by repositories
- `yaml`: reads `openapi/openapi.yaml` and serves it as JSON
- `tsx`: fast TypeScript execution in development
- `tailwindcss` and `@tailwindcss/vite`: utility-first styling with minimal setup in Vite

## Next Additions

- Apply `supabase/migrations/001_initial_schema.sql` to Supabase
- Add generated API client or contract tests once endpoints grow
- Add repository integration tests against Supabase
- Add CI for `make lint`, `make build`, and `make openapi-check`
