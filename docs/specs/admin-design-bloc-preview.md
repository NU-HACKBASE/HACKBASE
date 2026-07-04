# 管理画面 ブロックプレビュー表示仕様

## 対象
- 機能: 管理画面のブロック編集プレビュー
- 画面 / URL:
- `/admin/design/bloc/`
- `/admin/design/bloc_smartphone/`
- 関連チケット: `CU-86ewhu620`

## 背景
- ブロック編集のプレビュー実行時に、`bloc_html` 内で `constant('SC_Helper_Ranking::...')` を参照すると `Class "SC_Helper_Ranking" not found` が発生する。
- その結果、HTTP 500 で処理が中断し、編集画面へ戻れない。

## 要件
- `mode=preview` 実行時、`bloc_html` 内に `SC_Helper_Ranking` クラス定数参照が含まれていても致命エラーを発生させない。
- プレビュー実行後は編集画面へ復帰し、プレビュー領域に描画結果を表示できること。
- プレビュー機能は DB 更新を行わないこと。
- `mode=confirm` と `mode=delete` の既存挙動に影響を与えないこと。
- ブロック編集の一覧取得、登録、更新、削除は `SC_Query` を使用せず、Eloquent Model 経由で実行すること。

## 入力 / 出力
- 入力:
- `POST mode=preview`
- `POST bloc_id`
- `POST bloc_name`
- `POST filename`
- `POST bloc_html`
- `POST html_area_row`
- 出力:
- 同一画面上のプレビュー領域に結果を表示する
- 編集フォームの `bloc_name` `filename` `bloc_html` を保持する

## 制約
- 管理画面専用機能。
- PC/SP で同一抽象クラス `LC_Page_Admin_Design_AbstractBloc` を利用する。
- 既存テンプレート資産との互換性を維持する。
- Controller/Page から `where` `query` `select` を直接記述せず、Model メソッド経由で DB 操作する。
- Page 層では用途別メソッド呼び出しで処理を構成する。

## 非対象
- テンプレート文法エラーなど、既存のテンプレート不備全般の救済。
- プレビュー機構の全面的な再設計。

## 受け入れ条件
- `/admin/design/bloc/` でランキングブロック相当のテンプレート本文を入力してプレビューしても HTTP 500 にならない。
- `/admin/design/bloc_smartphone/` でも同条件で HTTP 500 にならない。
- プレビュー後も編集フォームの内容が維持される。
- 登録、削除の既存操作に回帰不具合がない。
- `LC_Page_Admin_Design_AbstractBloc` 内に `SC_Query` の直接利用が残っていない。
