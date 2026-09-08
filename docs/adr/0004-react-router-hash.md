# 画面切替は react-router の Hash 履歴

判定ログを別ウィンドウ（同じ Vite SPA）で開くとき、バンドル後の Tauri カスタムプロトコル（`tauri://localhost`）ではパスベースの履歴がサーバ相当のフォールバックに頼る。候補は `react-router`（Hash）、`TanStack Router`、`wouter`、自前の `location.hash` 分岐だった。すでに React 前提で、第2ウィンドウは `#/hantei-log` を載せるだけで足りるので、Hash 履歴が標準で揃う `react-router` を入れる。パス履歴は本番の空白画面になりやすいので採らない。

## Considered Options

|                    | react-router（Hash）         | TanStack Router                  | wouter                     | 自前 hash 分岐     |
| ------------------ | ---------------------------- | -------------------------------- | -------------------------- | ------------------ |
| カスタムプロトコル | `#/...` でホストを動かさない | Hash 履歴は自前設定が要る        | Hash 対応あり              | 動く               |
| 学習コスト         | 既存知見が多い               | 型付きルートが強いが導入が大きい | 薄いがエコシステムが小さい | ルート増加で崩れる |
| 依存               | `react-router` のみ          | ルータ本体が大きい               | 極小                       | なし               |

## Consequences

- `createHashRouter` で本編 `/` と判定ログ `/hantei-log` を分ける
- 第2ウィンドウは `WebviewWindow` で `/#/hantei-log` を開く。既にあれば前面化する
- Vite の MPA（別 HTML エントリ）にはしない
