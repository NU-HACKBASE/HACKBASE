# frontend Cloudflare デプロイ仕様

## 対象
- 機能: frontend の Cloudflare 配信設定
- 対象環境: Cloudflare Pages または Workers Assets
- 対象ディレクトリ: `frontend/`

## 背景
- frontend は Vite build の静的成果物を配信する構成である。
- backend は Render 側で配信し、frontend は Cloudflare 側で分離して配信したい。

## 要件
- `frontend/dist` を Cloudflare へ配信できること。
- SPA ルーティングで直接アクセスしても `index.html` にフォールバックできること。
- backend URL と WebSocket URL は `VITE_` 環境変数で注入できること。
- frontend 側だけで完結する Cloudflare 設定ファイルを置くこと。

## 入力 / 出力
- 入力:
- build command `npm --prefix frontend ci && npm --prefix frontend run build`
- 環境変数 `VITE_API_BASE_URL` `VITE_WS_URL`
- 出力:
- `frontend/dist`
- Cloudflare 上の公開 frontend URL

## 制約
- backend の Cloudflare 移植は対象外。
- `frontend` は Vite の `envDir: '..'` を使うため、ローカルでは repo ルート `.env` を読む。
- Cloudflare 上では `VITE_` 付き環境変数を platform 側に設定する。

## 非対象
- 独自ドメイン設定
- Cloudflare Access や WAF の詳細設定
- backend のデプロイ設定

## 受け入れ条件
- `frontend/wrangler.jsonc` が存在する。
- SPA fallback 設定が入っている。
- Cloudflare 上で `VITE_API_BASE_URL` `VITE_WS_URL` を注入できる。
