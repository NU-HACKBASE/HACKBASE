# AGENTS.md

このリポジトリで作業する AI エージェント向けの指示です。

## 最初に読むもの

作業前に、必要な範囲で次を確認してください。

1. `README.md`
2. `docs/architecture.md`
3. `docs/development.md`
4. `docs/api-guide.md`
5. `docs/websocket.md`
6. `docs/agent-guide.md`

## プロジェクト方針

- ハッカソン向けに、開発速度と保守性のバランスを優先する
- 過剰な抽象化を避ける
- フロントエンドとバックエンドを明確に分離する
- REST API は OpenAPI First で進める
- WebSocket はリアルタイム通知用として REST と責務を分ける
- AI や外部 API は `backend/src/external` または専用 service に閉じ込める

## Backend ルール

バックエンドは次の流れを守ります。

```text
Route -> Handler -> Service -> Repository -> Database
```

責務:

- `backend/src/routes`: URL と HTTP method を定義する
- `backend/src/handlers`: request/response を扱う
- `backend/src/services`: ユースケースと業務ロジックを扱う
- `backend/src/repositories`: PostgreSQL / Redis へのアクセスを扱う
- `backend/src/external`: AI API や外部 SaaS との接続を扱う
- `backend/src/ws`: WebSocket の接続と message handling を扱う

避けること:

- Handler に SQL を書かない
- Route に業務ロジックを書かない
- Repository に Hono の `Context` を渡さない
- Service に HTTP status code の判断を寄せすぎない
- WebSocket handler に複雑な業務ロジックを直接書かない

## Frontend ルール

- React + JavaScript + Vite + Tailwind CSS を使う
- API URL は `frontend/src/lib/config.js` を通す
- 画面固有のロジックと通信処理は分ける
- Tailwind の utility を基本にし、必要になるまで大きな CSS 設計を増やさない
- UI は「開発基盤の状態が分かる」ことを優先し、過度な装飾を避ける

## OpenAPI ルール

REST API を追加・変更するときは、先に `openapi/openapi.yaml` を更新します。

基本手順:

1. `openapi/openapi.yaml` を更新する
2. `make openapi-check` を実行する
3. route / handler / service / repository を実装する
4. `make lint` を実行する
5. `make build` を実行する

## WebSocket ルール

- endpoint は `ws://localhost:8787/ws`
- message は `{ "type": "...", "payload": ... }` の形に寄せる
- DB 更新の主処理は service 側に置く
- WebSocket は通知、同期、リアルタイム反映に使う

## コマンド

```bash
make setup
make dev-infra
make dev-backend
make dev-frontend
make lint
make build
make openapi-check
```

## 変更後チェック

コードを変更したら、変更内容に応じて実行してください。

- backend を変更した場合: `npm --prefix backend run lint`
- frontend を変更した場合: `npm --prefix frontend run lint`
- OpenAPI を変更した場合: `make openapi-check`
- 全体を確認する場合: `make lint && make build && make openapi-check`

## 依存関係の追加

ライブラリを追加するときは、次を説明できる状態にしてください。

- 何を解決するか
- 自作しない理由
- 代替案
- 削除しやすいか

## 禁止事項

- `.env` を commit しない
- `node_modules` や `dist` を commit しない
- 既存の未関係な変更を勝手に戻さない
- 仕様変更なしに OpenAPI と実装をズラさない
- ハッカソン段階で不要な巨大フレームワークや複雑な抽象化を入れない
