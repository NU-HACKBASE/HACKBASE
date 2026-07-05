# Backend

Hono + TypeScript backend for HACKBASE.

## Entry points

- `src/server.ts`: Node server and WebSocket upgrade setup
- `src/app.ts`: Hono app, middleware, route registration, Swagger UI
- `src/routes`: Route definitions
- `src/handlers`: HTTP request/response adapters
- `src/services`: Application use cases
- `src/repositories`: Supabase access
- `src/external`: External service adapters such as AI APIs
- `src/ws`: WebSocket handlers
