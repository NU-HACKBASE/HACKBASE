# Development Guide

## 初回セットアップ

```bash
make setup
```

このコマンドで frontend/backend の依存関係をインストールし、`.env.example` から `.env` を作成します。

`.env` の `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`、`SUPABASE_JWKS_URL` は実プロジェクトの値に置き換えてください。URL、key、Secret はコードや `docker-compose.yml` に直書きせず、必ず `.env` で管理します。

## 起動

バックエンドを起動します。

```bash
make dev-backend
```

フロントエンドを起動します。

```bash
make dev-frontend
```

## Docker で全体起動

frontend、backend を Docker で起動します。DB は `.env` の Supabase 変数で接続します。

```bash
make docker-up
```

直接 Docker Compose を使う場合:

```bash
docker compose up -d --build
```

## URL

| Target | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend health | http://localhost:8787/health |
| Swagger UI | http://localhost:8787/docs |
| OpenAPI JSON | http://localhost:8787/openapi.json |
| WebSocket | ws://localhost:8787/ws |

## よく使うコマンド

```bash
make lint
make test
make build
make openapi-check
make docker-up
make down
```

## 開発時の確認順

API や接続で詰まった場合は、この順番で確認します。

1. `docker compose ps`
2. `curl http://localhost:8787/health`
3. `make openapi-check`
4. `make lint`
5. ブラウザで http://localhost:5173 を開く

## コーディング方針

- 命名で責務を伝える
- Handler に業務ロジックを書かない
- Service に HTTP の詳細を持ち込まない
- Repository に request/response の詳細を持ち込まない
- AI など外部 API は `external` または専用 service に閉じ込める
- ハッカソン中は抽象化を増やすより、読める重複を許容する

## 新しいライブラリを追加するとき

追加する前に、次を README または PR description に残します。

- 何を解決するか
- 自作しない理由
- 代替案
- 削除しやすいか

例:

```text
Added openapi-typescript to generate frontend API types from OpenAPI.
Reason: prevent drift between backend contract and frontend calls.
Alternative: handwritten JSDoc types, but they are likely to drift quickly.
```
