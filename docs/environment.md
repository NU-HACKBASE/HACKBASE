# Environment Variables

`.env.example` がローカル開発用のテンプレートです。接続URL、パスワード、Secret、外部サービスURLは必ず `.env` で管理し、コードや `docker-compose.yml` に直書きしません。

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
| `AUTH_SECRET` | Backend | `change-me-in-production` | HMAC secret for current local auth tokens |
| `ADMIN_PASSWORD` | Backend | `admin` | Local admin login password |
| `SUPABASE_URL` | Backend | `https://<project-ref>.supabase.co` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Backend | `sb_publishable_...` | Supabase publishable key |
| `SUPABASE_SECRET_KEY` | Backend | `sb_secret_...` | Supabase secret key for server-side access |
| `SUPABASE_JWKS_URL` | Backend | `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` | JWKS endpoint for JWT verification |
| `SUPABASE_DB_URL` | Migration | `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require` | Direct Postgres URL used only for schema migrations |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8787` | REST API base URL |
| `VITE_WS_URL` | Frontend | `ws://localhost:8787/ws` | WebSocket URL |

## 注意

- `.env` は commit しない
- frontend で使う環境変数は `VITE_` prefix が必要
- backend は `backend/src/config/env.ts` で読み込む
- frontend は `frontend/src/lib/config.js` で読み込む
- `SUPABASE_SECRET_KEY` は backend のみに置き、frontend に公開しない

## Supabase

主DBは Supabase です。Supabase Dashboard から URL と key を取得し、`.env` に設定します。

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_DB_URL=postgresql://postgres:<database-password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

## 本番環境で変えるもの

- `APP_ENV`
- `CORS_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_JWKS_URL`
- `SUPABASE_DB_URL`
- `AUTH_SECRET`
- `ADMIN_PASSWORD`
- `VITE_API_BASE_URL`
- `VITE_WS_URL`

本番では `SUPABASE_SECRET_KEY` と `SUPABASE_DB_URL` に秘密情報が含まれるため、GitHub Secrets やホスティングサービスの環境変数管理に置きます。
