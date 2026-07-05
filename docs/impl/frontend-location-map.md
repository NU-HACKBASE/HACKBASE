# frontend 現在地マップ実装メモ

## 対象ファイル
- `frontend/src/pages/MapPage.jsx`
- `frontend/src/index.css`
- `frontend/package.json`

## 現状処理フロー
1. `/map` は装飾的な疑似マップを描画している。
2. 現在地は固定のラベル表示で、Geolocation API は使っていない。

## 問題 / 変更理由
- 地図画面の情報が位置情報と連動していない。
- API 連携前でも、現在地ベースの体験を確認できる状態が必要。
- map がサイドカード中心のレイアウトで、全面地図としての没入感が弱い。
- `watchPosition()` だけでは初回取得失敗時の再試行や状態表示が弱い。

## 対応方針
- `Leaflet` を map 描画ライブラリとして利用する。
- タイルは OpenStreetMap を使う。
- 現在地取得は `getCurrentPosition()` と `watchPosition()` を併用する。
- 逆ジオコーディングは Nominatim を直接使い、連続リクエストは粗く間引く。
- UI は送付されたサンプルに合わせ、右上の現在地情報パネルだけをオーバーレイする。
- イベントは固定データとして map 画面へ表示する。
- イベントデータは緯度、経度、盛り上がり度、半径を持つ。
- 盛り上がり度に応じてピンと範囲円の色を変える。
- Leaflet のズームコントロールは表示しない。

## 実施内容
- `leaflet` 依存を追加する。
- `MapPage` を Geolocation + Leaflet ベースへ置き換える。
- map が全面表示になるよう layout と page 構成を調整する。
- 現在地の緯度、経度、地名を右上パネルに表示する。
- 位置情報の取得失敗理由を地名欄へ表示する。
- 地図用スタイルと三角形の現在地矢印マーカーのスタイルを `index.css` に追加する。
- 松原高校と緑丘中学校の固定イベントデータを追加し、Leaflet marker と circle で表示する。

## 確認
- 実行コマンド:
- `npm --prefix frontend run build`
- `npm --prefix frontend run lint`
- 結果:
- build と lint が通ること
- `/map` で地図が表示されること

## 既知課題
- Nominatim の利用は頻度制限に注意が必要。
- Geolocation 非対応環境では現在地取得はできない。
