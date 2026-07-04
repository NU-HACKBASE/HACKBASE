# Render backend デプロイ仕様

## 対象
- 機能: backend の Render デプロイ設定
- 対象環境: Render Web Service
- 関連画面 / URL:
- backend API
- backend WebSocket

## 背景
- 現在の backend は Node サーバーとして動作し、`/ws` で WebSocket を受ける。
- Cloudflare Workers ではなく、Node 常駐型の実行環境にそのまま載せたい。

## 要件
- Render 上で Node backend を起動できること。
- `/health` `/openapi.json` `/docs` `/ws` を継続して公開できること。
- Render が提供する `PORT` 環境変数で待ち受けできること。
- `DATABASE_URL` `REDIS_URL` `CORS_ORIGIN` を Render の環境変数で注入できること。
- 既存のローカル開発フローを壊さないこと。

## 入力 / 出力
- 入力:
- Render の Git 連携または Blueprint
- 環境変数 `CORS_ORIGIN` `DATABASE_URL` `REDIS_URL`
- 出力:
- 公開 backend URL
- `wss://<backend-host>/ws` での WebSocket endpoint

## 制約
- backend は repo ルートにある `openapi/openapi.yaml` を参照する。
- Render 側で frontend は配信しない。
- DB / Redis の実体は Render 内蔵に限定せず、外部サービスでもよい。

## 非対象
- frontend の Cloudflare Pages デプロイ設定
- 本番 DB / Redis サービスの具体的な選定
- WebSocket の水平分散構成

## 受け入れ条件
- Render で build と start が成功する。
- `GET /health` が 200 を返す。
- `GET /openapi.json` と `GET /docs` が表示できる。
- `wss://<backend-host>/ws` に接続できる。
