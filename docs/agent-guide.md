# Agent Guide

この文書は、AI エージェントやペア開発者がこのリポジトリで作業するときの判断基準です。

ルートの `AGENTS.md` は短い実務指示、この文書は背景とレビュー観点を含む補足です。

## 作業開始時の確認

まず次を確認します。

```bash
pwd
find . -maxdepth 3 -type f -not -path './.git/*' -not -path './frontend/node_modules/*' -not -path './backend/node_modules/*' -not -path './frontend/dist/*' -not -path './backend/dist/*' | sort
```

次に、作業内容に応じて読む文書を選びます。

| Task | Read |
| --- | --- |
| API 追加 | `docs/api-guide.md`, `openapi/openapi.yaml` |
| WebSocket 変更 | `docs/websocket.md`, `backend/src/ws/socket.ts` |
| Backend 構成変更 | `docs/architecture.md`, `backend/src/app.ts` |
| Frontend 変更 | `frontend/src/App.jsx`, `frontend/src/lib/config.js` |
| 環境変数変更 | `docs/environment.md`, `.env.example` |

## 実装判断

このリポジトリでは、将来の拡張性よりも「今のチームが読めること」を少し優先します。

良い判断:

- 既存のレイヤーに合わせてファイルを置く
- 小さな service/repository を足す
- OpenAPI に先に仕様を追加する
- 複雑になった時点で抽象化する

避けたい判断:

- 最初から汎用的すぎる base class を作る
- Handler から DB や外部 API を直接呼ぶ
- 仕様が固まる前に巨大な状態管理ライブラリを入れる
- OpenAPI を更新せずに REST API を増やす

## API 実装チェックリスト

新しい REST API を追加したら確認します。

- `openapi/openapi.yaml` に path がある
- request body / response schema が OpenAPI にある
- route は `backend/src/routes` にある
- handler は HTTP の詳細だけを扱っている
- service にユースケースがある
- repository に DB/cache access が閉じている
- `make openapi-check` が通る
- `npm --prefix backend run lint` が通る

## Frontend 実装チェックリスト

Frontend を変更したら確認します。

- API の base URL は `frontend/src/lib/config.js` を使っている
- 画面テキストが開発者にとって分かりやすい
- Tailwind class が過度に複雑になっていない
- mobile でも主要情報が読める
- `npm --prefix frontend run lint` が通る
- 必要なら `npm --prefix frontend run build` が通る

## WebSocket 実装チェックリスト

WebSocket を変更したら確認します。

- message に `type` がある
- `payload` の shape が分かる
- 接続時、切断時、エラー時の扱いがある
- DB 更新の本体を WebSocket handler に閉じ込めていない
- 必要なら REST API と組み合わせている

## レビュー観点

レビューでは次を優先します。

1. OpenAPI と実装がズレていないか
2. レイヤー境界が崩れていないか
3. local dev が壊れていないか
4. 環境変数が `.env.example` と docs に反映されているか
5. 新しい依存関係の理由が説明されているか

## 迷ったとき

迷ったら、まず小さく実装します。

ハッカソン中は、完璧な抽象化よりも、次の人が読んで直せる構成を優先します。
