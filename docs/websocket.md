# WebSocket Guide

WebSocket は REST API と分けて、リアルタイム通知に使います。

現在のエンドポイント:

```text
ws://localhost:8787/ws
```

実装ファイル:

- `backend/src/server.ts`
- `backend/src/ws/socket.ts`
- `backend/src/ws/hub.ts`
- `frontend/src/hooks/useRoomChatSocket.js`
- `frontend/src/pages/RoomChatPage.jsx`

## 現在の動き

1. frontend が `/ws` に接続する
2. backend から `connected` message が送られる
3. frontend が `room.subscribe` を送る
4. 同じ room を購読している client へ chat イベントが broadcast される

### 接続直後

```json
{
  "type": "connected",
  "payload": {
    "message": "WebSocket connected",
    "timestamp": "2026-07-04T04:50:54.668Z"
  }
}
```

### ルーム購読

```json
{
  "type": "room.subscribe",
  "payload": {
    "roomId": "room-uuid"
  }
}
```

### サーバーからの chat 通知

- `chat.created`
- `chat.updated`
- `chat.deleted`

## Message Format

基本形は次の形式に揃えます。

```json
{
  "type": "message.type",
  "payload": {}
}
```

## 実装方針

- REST は状態の取得・作成・更新に使う
- WebSocket はリアルタイム通知に使う
- WebSocket message は必ず `type` を持つ
- DB 更新の本体は service に寄せ、service から hub へ broadcast する
- WebSocket handler に複雑な業務ロジックを書かない

## 動作確認

```bash
node -e "
const ws = new WebSocket('ws://localhost:8787/ws');
ws.onopen = () => ws.send(JSON.stringify({ type: 'room.subscribe', payload: { roomId: 'room-id' } }));
ws.onmessage = (e) => console.log(e.data);
"
```

## 今後入れるとよいもの

- WebSocket upgrade 時の認証
- presence の server 管理
- message schema validation の強化
