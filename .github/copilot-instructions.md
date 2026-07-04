# Copilot Instructions

Follow the repository rules in `AGENTS.md`.

Key points:

- Keep frontend and backend separated.
- Backend follows `Route -> Handler -> Service -> Repository -> Database`.
- Update `openapi/openapi.yaml` before changing REST API behavior.
- Keep WebSocket message format close to `{ type, payload }`.
- Do not put SQL or external API calls in handlers.
- Do not commit `.env`, `node_modules`, or `dist`.
- Prefer simple, readable code over broad abstractions.
