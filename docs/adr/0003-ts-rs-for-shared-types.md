# IPC の共有型は ts-rs で出す

Rust と TypeScript で同じ JSON の形を手書きしたくない。候補は `tauri-specta`（コマンドまで生成）と `ts-rs`（型だけ生成）だった。必要なのはエラーログなどの**データの形**であり、`invoke` の薄い包みは既に `store.ts` にある。Tauri 2 向けの `tauri-specta` は 2026-05 時点でも `2.0.0-rc` のままなので、安定している `ts-rs` で型だけ出す。

## Considered Options

|          | ts-rs 12                                           | tauri-specta 2（Tauri 2 向け）                                     |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| 出すもの | 構造体・列挙の TypeScript 型                       | 型に加え、型付きコマンド（とイベント）                             |
| 安定版   | 12.0.1                                             | Tauri 2 は `2.0.0-rc.25`（2023 末から RC）                         |
| 依存     | `ts-rs` だけ                                       | `specta` + `tauri-specta` + TypeScript エクスポート                |
| serde    | `rename` / `tag` / `untagged` などを既定で読む     | `specta::Type` を別途付ける                                        |
| 導入     | `#[derive(TS)]` と `cargo test` でファイル書き出し | 全コマンドに Specta、Builder の組み替え                            |
| 注意     | コマンド名の typo は見ない                         | 生成先が Tauri のホットリロード対象だと無限リロード。引数は最大 10 |
| 規模     | ダウンロード約 1400 万、dependent 300 超           | 約 120 万、dependent 7                                             |

`tauri-specta` が勝つのは、`commands.saveGenbun(...)` のように IPC 口まで生成したいとき。v1 はその薄さが数十行で足りる。エラーログ（#36）も同じ JSON 行を両側で書くことが目的なので、型の共有だけで足りる。

## Consequences

- 生成型は `apps/app/src/_lib/` に置き、`store.ts` の手書き型を寄せる。`invoke` は残す
- コマンドの登録の仕方は変えない
- Specta が Tauri 2 で安定したら、口の生成を足す余地はある。今は採らない
