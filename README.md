# HACKBASE

React/Vite frontend and Hono/TypeScript backend foundation for hackathon-speed web app development.

## Documentation

- [Docs index](./docs/README.md)
- [Architecture](./docs/architecture.md)
- [Development Guide](./docs/development.md)
- [API Guide](./docs/api-guide.md)
- [WebSocket Guide](./docs/websocket.md)
- [Environment Variables](./docs/environment.md)
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
│       ├── repositories/  PostgreSQL/Redis access
│       ├── external/      AI and third-party service adapters
│       ├── ws/            WebSocket handlers
│       ├── db/            Database/cache clients
│       └── config/        Environment configuration
├── openapi/               OpenAPI first API contract
├── docs/                  Development documentation
├── docker-compose.yml     PostgreSQL and Redis for local development
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
make dev-infra
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
make dev-infra     # start PostgreSQL and Redis
make dev-backend   # start Hono backend
make dev-frontend  # start Vite frontend
make docker-up     # build and start frontend, backend, PostgreSQL, Redis
make docker-build  # build Docker images
make build         # build backend and frontend
make lint          # backend typecheck and frontend eslint
make openapi-check # validate required OpenAPI shape
make down          # stop containers
make clean         # stop containers and remove volumes
```

## OpenAPI First

`openapi/openapi.yaml` is the API contract source of truth. Add or change the contract first, then implement the matching route, handler, service, and repository.

The backend serves the contract at `/openapi.json` and Swagger UI at `/docs`.

## Why This Structure

The frontend and backend are separated so each can evolve independently. The backend keeps a simple layered architecture because it gives clear responsibility boundaries without introducing framework-heavy patterns.

Compared with a single full-stack framework, this setup has a little more wiring, but it makes REST, WebSocket, PostgreSQL, Redis, and future AI services explicit. Compared with a large clean architecture template, this is faster to understand and easier to change during a hackathon.

## Pros

- Clear place to add new API endpoints
- OpenAPI contract is visible from day one
- PostgreSQL and Redis are available locally with health checks
- WebSocket support is included without affecting REST routes
- AI and third-party services can be added without mixing them into route code
- Minimal abstractions keep the code approachable

## Cons

- OpenAPI and implementation are not yet automatically diffed
- No migration tool is included yet
- No test framework is included yet
- Local Docker Compose runs infrastructure only, not the app processes

## Library Choices

- `hono`: small, fast backend framework with good TypeScript support
- `@hono/node-server`: runs Hono on Node.js for local and container-friendly deployment
- `@hono/node-ws`: adds WebSocket upgrade support for Node
- `@hono/swagger-ui`: serves Swagger UI directly from the backend
- `pg`: standard PostgreSQL client
- `redis`: official Redis client
- `yaml`: reads `openapi/openapi.yaml` and serves it as JSON
- `tsx`: fast TypeScript execution in development
- `tailwindcss` and `@tailwindcss/vite`: utility-first styling with minimal setup in Vite

## Next Additions

- Add database migrations when the first table is introduced
- Add generated API client or contract tests once endpoints grow
- Add Vitest for service-level tests
- Add CI for `make lint`, `make build`, and `make openapi-check`
