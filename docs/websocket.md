# WebSocket Guide

WebSocket は REST API と分けて、リアルタイム通知や共同編集などに使います。

現在のエンドポイント:

```text
ws://localhost:8787/ws
```

実装ファイル:

- `backend/src/server.ts`
- `backend/src/ws/socket.ts`
- `frontend/src/App.jsx`

## 現在の動き

接続すると backend から `connected` message が送られます。

```json
{
  "type": "connected",
  "payload": {
    "message": "WebSocket connected",
    "timestamp": "2026-07-04T04:50:54.668Z"
  }
}
```

frontend から message を送ると、backend は `echo` として返します。

## Message Format

基本形は次の形式に揃えます。

```json
{
  "type": "message.type",
  "payload": {}
}
```

例:

```json
{
  "type": "chat.message.created",
  "payload": {
    "id": "message-id",
    "body": "hello"
  }
}
```

## 実装方針

- REST は状態の取得・作成・更新に使う
- WebSocket はリアルタイム通知に使う
- WebSocket message は必ず `type` を持つ
- DB 更新の本体は REST または service に寄せる
- WebSocket handler に複雑な業務ロジックを書かない

## 動作確認

Node.js の組み込み WebSocket で確認できます。

```bash
node -e "const ws=new WebSocket('ws://localhost:8787/ws'); ws.onmessage=(e)=>{ console.log(e.data); ws.close(); };"
```

## 今後入れるとよいもの

- 接続ユーザー管理
- room/channel 管理
- message schema validation
- reconnect policy
- 認証後の WebSocket upgrade
