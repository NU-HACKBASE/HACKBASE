# Architecture

このプロジェクトは、フロントエンドとバックエンドを分離した構成です。

```text
frontend/   React + JavaScript + Vite + Tailwind CSS
backend/    Hono + TypeScript
openapi/    API contract
docs/       Development documentation
```

## Backend

バックエンドはシンプルなレイヤードアーキテクチャです。

```text
Route
 ↓
Handler
 ↓
Service
 ↓
Repository
 ↓
Database / Cache
```

各レイヤーの責務は次の通りです。

| Layer | Directory | Responsibility |
| --- | --- | --- |
| Route | `backend/src/routes` | URL、HTTP method、Handler の接続 |
| Handler | `backend/src/handlers` | request/response の変換 |
| Service | `backend/src/services` | ユースケース、業務ロジック |
| Repository | `backend/src/repositories` | PostgreSQL、Redis などの永続化層アクセス |
| DB Client | `backend/src/db` | PostgreSQL / Redis クライアント生成 |
| External | `backend/src/external` | AI API、外部 SaaS、第三者 API との接続 |
| WebSocket | `backend/src/ws` | WebSocket 接続、message handling |

## Frontend

フロントエンドは React + Vite + Tailwind CSS です。

現在は開発基盤の接続確認画面として、次を表示しています。

- REST API health status
- WebSocket connection status
- PostgreSQL / Redis dependency status
- Swagger UI へのリンク

主要ファイル:

- `frontend/src/App.jsx`
- `frontend/src/lib/config.js`
- `frontend/src/index.css`

## OpenAPI First

API の仕様は `openapi/openapi.yaml` を起点にします。

新しい REST API を追加するときは、先に OpenAPI を更新してから backend を実装します。

```text
openapi/openapi.yaml
 ↓
backend/src/routes
 ↓
backend/src/handlers
 ↓
backend/src/services
 ↓
backend/src/repositories
```

## なぜこの構成か

ハッカソンでは、速く作れることと壊れにくいことの両方が必要です。

この構成は、巨大な Clean Architecture ほど重くせず、最低限の責務分離だけを入れています。機能が増えたときも、API、画面、DB、外部サービスを混ぜずに追加できます。

## メリット

- 新しい API の置き場所が明確
- REST と WebSocket を分けて扱える
- OpenAPI が API 仕様の入口になる
- AI など外部サービスを route/handler に混ぜずに追加できる
- PostgreSQL / Redis の接続確認がすぐできる

## デメリット

- 小さい機能でもファイル数は少し増える
- OpenAPI と実装の完全な自動同期はまだない
- DB migration や test framework は未導入

## 今後の拡張候補

- DB migration: Drizzle Kit, Prisma Migrate, node-pg-migrate
- API client generation: openapi-typescript, Orval
- Test: Vitest
- CI: GitHub Actions
