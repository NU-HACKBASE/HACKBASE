# API Guide

REST API は OpenAPI First で追加します。

## API 追加手順

1. `openapi/openapi.yaml` に path と schema を追加する
2. `make openapi-check` を実行する
3. `backend/src/routes` に route を追加する
4. `backend/src/handlers` に handler を追加する
5. `backend/src/services` に use case を追加する
6. DB アクセスが必要なら `backend/src/repositories` に repository を追加する
7. `backend/src/app.ts` に route を登録する
8. `make lint` と `make build` を実行する

## 現在の API

### `GET /health`

API と Supabase の状態を返します。

```bash
curl http://localhost:8787/health
```

正常時の例:

```json
{
  "status": "ok",
  "timestamp": "2026-07-04T04:50:49.339Z",
  "services": {
    "api": "ok",
    "database": "ok"
  }
}
```

## Handler の役割

Handler は HTTP の入口です。

やること:

- path/query/body を読む
- service を呼ぶ
- status code と JSON を返す

避けること:

- SQL を書く
- 外部 API を直接呼ぶ
- 複雑な業務ロジックを書く

## Service の役割

Service はユースケースを表現します。

やること:

- 入力値をアプリケーションの概念として扱う
- repository を組み合わせる
- 外部 service を呼ぶ
- 結果を handler に返す

## Repository の役割

Repository はデータアクセスを担当します。

やること:

- Supabase client でテーブルを操作する
- DB の結果を service が扱いやすい形にする

避けること:

- HTTP response を作る
- Hono の `Context` を受け取る
- 画面都合のデータ整形をする

## OpenAPI と実装のズレを防ぐ

現時点の `make openapi-check` は最低限の構造チェックです。

エンドポイントが増えてきたら、次のどちらかを追加します。

- `openapi-typescript` で型生成する
- contract test で route と OpenAPI path を照合する
