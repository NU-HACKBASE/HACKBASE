# frontend Cloudflare デプロイ実装メモ

## 対象ファイル
- `frontend/wrangler.jsonc`
- `frontend/README.md`

## 現状処理フロー
1. frontend は Vite で build して `frontend/dist` を生成する。
2. API / WebSocket の向き先は `frontend/src/lib/config.js` の `VITE_` 環境変数で切り替える。

## 問題 / 変更理由
- frontend 側の Cloudflare 配信設定ファイルがなかった。
- SPA のため、直接アクセス時の fallback 設定を明示しておきたい。

## 対応方針
- Cloudflare 向けに `frontend/wrangler.jsonc` を追加する。
- `assets.directory` は `dist` を指し、SPA fallback を有効にする。
- README に build と環境変数の前提を短く残す。

## 実施内容
- `frontend/wrangler.jsonc` を追加した。
- `not_found_handling: single-page-application` を設定した。
- `frontend/README.md` に Cloudflare 用の build command と output directory を追記した。

## 確認
- 実行コマンド:
- `npm --prefix frontend run build`
- 結果:
- `frontend/dist` が生成されること
- Cloudflare 側の assets directory と一致すること

## 既知課題
- Cloudflare Pages を使う場合、実際の project 設定はダッシュボード側でも必要。
- 本番 URL は backend の Render URL 確定後に `VITE_API_BASE_URL` と `VITE_WS_URL` へ設定する必要がある。
