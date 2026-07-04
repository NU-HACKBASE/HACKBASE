# Environment Variables

`.env.example` がローカル開発用のテンプレートです。

```bash
cp .env.example .env
```

## Variables

| Name | Used by | Example | Description |
| --- | --- | --- | --- |
| `APP_ENV` | Backend | `development` | Application environment |
| `BACKEND_HOST` | Backend | `0.0.0.0` | Backend bind host |
| `BACKEND_PORT` | Backend | `8787` | Backend port |
| `CORS_ORIGIN` | Backend | `http://localhost:5173` | Allowed frontend origin |
| `DATABASE_URL` | Backend | `postgres://hackbase:hackbase@localhost:5432/hackbase` | PostgreSQL connection URL |
| `REDIS_URL` | Backend | `redis://localhost:6379` | Redis connection URL |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8787` | REST API base URL |
| `VITE_WS_URL` | Frontend | `ws://localhost:8787/ws` | WebSocket URL |

## 注意

- `.env` は commit しない
- frontend で使う環境変数は `VITE_` prefix が必要
- backend は `backend/src/config/env.ts` で読み込む
- frontend は `frontend/src/lib/config.js` で読み込む
- Docker Compose の backend では `postgres` と `redis` を service name として使う

## 本番環境で変えるもの

- `APP_ENV`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `REDIS_URL`
- `VITE_API_BASE_URL`
- `VITE_WS_URL`

本番では `DATABASE_URL` と `REDIS_URL` に秘密情報が含まれるため、GitHub Secrets やホスティングサービスの環境変数管理に置きます。
