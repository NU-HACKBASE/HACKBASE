# Fly.io Deploy

Fly.io では backend の Dockerfile を使って Hono API を公開します。DB は Supabase を使うため、Fly.io 側にローカルDBやRedisは作りません。

## 前提

- `flyctl` をインストール済み
- Supabase の初期スキーマ適用済み
- `.env` に production 用の値を用意済み

## ログイン

```bash
flyctl auth login
```

## アプリ作成

アプリ名はグローバル一意です。`hackbase-backend` が使えない場合は別名にしてください。

```bash
flyctl apps create hackbase-backend
```

別名にした場合は [fly.toml](../fly.toml) の `app` も同じ名前に変更します。

## Secrets

秘密情報や環境ごとに変わる値は `fly secrets` で設定します。`SUPABASE_DB_URL` は migration 用なので、backend runtime には不要です。
値は必ず `.env` で管理し、Fly.io には `.env` から読み込んで登録します。placeholder をそのまま登録すると backend が起動できません。

```bash
set -a
source .env
set +a

flyctl secrets set \
  CORS_ORIGIN="$CORS_ORIGIN" \
  AUTH_SECRET="$AUTH_SECRET" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY" \
  SUPABASE_SECRET_KEY="$SUPABASE_SECRET_KEY" \
  SUPABASE_JWKS_URL="$SUPABASE_JWKS_URL" \
  --app hackbase-backend
```

`.env` に入れる値の例:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
```

確認:

```bash
flyctl secrets list
```

## デプロイ

```bash
flyctl deploy
```

## GitHub Actions で自動デプロイ

`.github/workflows/deploy-fly.yml` は `main` ブランチへの push で backend を Fly.io に自動デプロイします。手動実行も GitHub Actions の `workflow_dispatch` から可能です。

PR では `.github/workflows/ci.yml` により検証のみ行い、Fly.io へのデプロイは行いません。

GitHub repository の Secrets に次を登録してください。

```text
FLY_API_TOKEN
```

token はローカルで次のコマンドから取得できます。

```bash
flyctl auth token
```

自動デプロイ前には GitHub Actions 上で次を実行します。

```bash
npm --prefix backend run test
npm --prefix backend run openapi:check
npm run build
```

## 確認

```bash
flyctl status
flyctl logs
curl https://hackbase-backend.fly.dev/health
```

期待値:

```json
{
  "status": "ok",
  "services": {
    "api": "ok",
    "database": "ok"
  }
}
```

## 注意

- `SUPABASE_SECRET_KEY` は backend のみに設定し、frontend には渡さない
- `CORS_ORIGIN` は公開する frontend のURLに合わせる
- `fly.toml` には秘密情報を書かない
- region は `primary_region = "nrt"` にしています。必要に応じて Supabase project の region に近い場所へ変更します
