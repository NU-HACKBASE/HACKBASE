# Supabase

HACKBASE は本格運用の主DBとして Supabase を使います。バックエンドは `@supabase/server` と `@supabase/supabase-js` で Supabase に接続し、Repository 層からテーブルを操作します。

## 方針

- DB 接続先は Supabase を基本にする
- Supabase URL、Publishable key、Secret key、JWKS URL は必ず `.env` で管理する
- `docker-compose.yml` やコードに接続情報を直書きしない
- スキーマは `supabase/migrations/` にSQLとして残す

## .env

`.env.example` をコピーし、Supabase Project Settings で取得した値に置き換えます。

```bash
cp .env.example .env
```

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_DB_URL=postgresql://postgres:<database-password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

`SUPABASE_DB_URL` は migration 用です。Supabase Dashboard の connection string にある `[YOUR-PASSWORD]` を database password に置き換えてください。パスワードに `@`, `#`, `/`, `?` などが含まれる場合は URL encode します。

## スキーマ適用

初期スキーマは次にあります。

```text
supabase/migrations/001_initial_schema.sql
```

Supabase Dashboard の SQL Editor、または Supabase CLI から適用します。現時点では軽量さを優先し、Drizzle / Prisma / node-pg-migrate は入れていません。

## 起動

通常開発では DB は Supabase を見ます。ローカルDBやローカルRedisは起動しません。

```bash
make dev-backend
make dev-frontend
```

frontend / backend を Docker で起動する場合も、DB は `.env` の `SUPABASE_URL` と key 群で接続します。

```bash
make docker-up
```

## メリット

- Supabase Dashboard でデータ確認やSQL実行ができる
- Repository 層は Supabase client に閉じるため、接続情報をSQL接続文字列として扱わない
- Docker Compose にDBパスワードを持たせず、環境ごとの差分を `.env` に集約できる
- `SUPABASE_JWKS_URL` を使った JWT 検証へ拡張しやすい

## 注意点

- `SUPABASE_SECRET_KEY` は秘密情報なので commit しない
- `SUPABASE_DB_URL` は migration 用の秘密情報なので commit しない
- `SUPABASE_URL`、key、JWKS URL はプロジェクトごとに異なる
- Secret key は backend のみで使い、frontend に渡さない
- 将来スキーマ変更が増えたら、Supabase CLI か migration tool の導入を検討する
