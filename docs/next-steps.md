# Next Steps

## Supabase

- Supabase Project Settings から URL、Publishable key、Secret key、JWKS URL、DB connection string を取得し、`.env` に設定する
- `supabase/migrations/001_initial_schema.sql` を Supabase に適用する
- 実DB接続で `GET /health` が `database: ok` になることを確認する

## API

- OpenAPI と実装の差分検知を強める
- Repository の統合テストを Supabase で追加する
- WebSocket 通知をチャット投稿やルーム更新と接続する

## Frontend

- 既存APIクライアントから実APIへの接続確認を進める
- OpenAPI から型またはクライアントを生成するか判断する
- 管理画面と一般ユーザー画面のフォーム検証を追加する

## Operations

- GitHub Actions で `make lint`, `make test`, `make build`, `make openapi-check` を実行する
- 本番用の `AUTH_SECRET`, `ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`, `SUPABASE_DB_URL` をホスティング側の環境変数に登録する
- `.env` にしか置いてはいけない値のレビュー観点をPRテンプレートに追加する
