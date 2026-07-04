# Render backend デプロイ実装メモ

## 対象ファイル
- `render.yaml`
- `backend/src/config/env.ts`

## 現状処理フロー
1. backend は `@hono/node-server` で HTTP サーバーを起動する。
2. `backend/src/server.ts` が `/ws` の WebSocket upgrade を登録する。
3. 環境変数は `backend/src/config/env.ts` で読む。

## 問題 / 変更理由
- Render では待ち受けポートが `PORT` で渡される。
- 既存コードは `BACKEND_PORT` 前提のため、そのままだと環境依存になる。
- デプロイ設定が repo にないため、毎回手動設定が必要になる。

## 対応方針
- `env.ts` で `PORT` を優先的に読む。
- Render Blueprint 用の `render.yaml` を追加する。
- DB / Redis の接続先は固定せず、環境変数注入に委ねる。

## 実施内容
- `backend/src/config/env.ts` で `process.env.PORT` を優先するよう変更した。
- `render.yaml` を追加し、backend Web Service の build / start / health check / env var を定義した。

## 確認
- 実行コマンド:
- `npm --prefix backend run lint`
- `npm --prefix backend run build`
- 結果:
- ローカルビルドが通ること
- Render で必要なポート設定がコードに反映されていること

## 既知課題
- 実際の Render デプロイは Render アカウント連携と環境変数設定が必要。
- free plan ではアイドル時スピンダウンの影響を受ける可能性がある。
