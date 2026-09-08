# 完成までの TODO

上から順にやる。テストは `pnpm test run {ファイル名}` だけ。全テスト実行はしない。変更した純関数・フックには、正常系・異常系・境界値を隣の `*.test.ts` / `*.test.tsx` に書く。Go API と `apps/web` は作らない。

実装に入るときは `add-feature` と `write-test` に従う。用語は [CONTEXT.md](../CONTEXT.md)。仕様は [design.md](./design.md) と [hantei.md](./hantei.md)。

## 0. 土台

- [x] `apps/app` に Tauri + React + Vite を足す。パッケージ名は `@language-teacher/app`
- [x] ルート `package.json` の `"tauri": "pnpm --filter @kakeibo/app tauri"` を `@language-teacher/app` に直す
- [x] `turbo.json` に `apps/app` の `dev` / `build` / `typecheck` / `test` / `test:run` が乗ることを確認する。Tauri の成果物を `outputs` に誤って `.next` だけ見ない
- [x] 家計簿名残のうち、この作業で触るファイルだけ直す（`package.json` の filter は必須。他は触ったとき）
- [x] `pnpm --filter @language-teacher/app tauri dev` で空ウィンドウが開く

完了: ウィンドウが開き、`apps/web` も `api` も無い。

## 1. 学習言語と文の分割

- [x] `src/_lib/gakushu_gengo.ts` — `en` / `zh_hans` / `ko` / `de` と表示名
- [x] `src/_lib/bun.ts` — `splitBun`（`。！？．` と改行。空断片を捨てる）
- [x] `mergeBun` / `resplitBun`（結合、キャレット位置で再分割。判定は捨てる）
- [x] `bun.test.ts` — 通常の句点、末尾に句点なし、連続改行、鉤括弧内の句点、空、結合、再分割

完了: 純関数だけで、貼った文字列が文の配列になる。

## 2. 貼り付けと文一覧（LLM なし）

- [x] `GenbunPaste` — 空では進めない
- [x] `GakushuGengoSelect` — 原文に対して一つ。選んだら変えられない
- [x] `BunList` — 境界に目印。クリックで選択
- [x] `YakubunField` — 選択中だけ表示し、マウント時にフォーカス
- [x] Tab で次の文、末尾では動かない。Ctrl+Enter は選択を動かさない
- [x] 結合・再分割の操作

完了: Ollama 無しで、貼る → 言語 → 一文ずつ入力、まで手で通る。

## 3. 保存

- [x] Rust `store.rs` — SQLite。`genbun` / `bun` / `settings`（[design.md](./design.md)）
- [x] `save_genbun` / `list_genbun` / `load_genbun` / `delete_genbun`
- [x] `useGenbun` — 貼り付け・訳文変更・結合再分割を保存する
- [x] `GenbunIndex` — 先頭行・言語・日時。開く・消す
- [x] 訳文が空のまま Tab しても、空が保存される

完了: アプリを終了して開き直し、原文と訳文が戻る。判定欄は未判定。

## 4. Ollama 検知と設定

- [x] `ollama.rs` — `GET /api/tags`。届かない／モデル無しを分ける
- [x] `ollama_status`、`load_settings` / `save_settings`
- [x] 既定 URL `http://127.0.0.1:11434`、既定モデル `qwen3:8b`、選択肢に `qwen3:14b`
- [x] 起動時と設定保存後に検知
- [x] `OllamaSetup` — [ollama.md](./ollama.md) と同じ手順を、失敗理由ごとに出す。判定ボタンと Tab 判定を無効化
- [x] `Settings`
- [x] `useOllama.ts` のテストは、Rust をモックできる境界（フロントの分岐）だけ。HTTP 本体は Rust 側のテストまたは手動

完了: Ollama を止めると起動直後に手順が出て判定できない。起動して `qwen3:8b` を入れると消える。

## 5. 判定

- [x] `hantei.ts` — 応答型。`tekisetsu` が `imi && bunpo` とずれたら補正する純関数
- [x] `hantei.test.ts` — 補正、空訳文は呼ばない、不適切なら `shiteki` を捨てる、適切なら `hinto` を捨てる
- [x] `hantei.rs` — OpenAI 互換で JSON を取る。失敗したら1回だけ再送。プロンプトは [hantei.md](./hantei.md)
- [x] 学習言語ごとの破綻表を、その言語のときだけプロンプトに足す
- [x] `hantei_bun` — 原文全体 + 対象の文 + 訳文
- [x] `useHantei` — Tab / Ctrl+Enter / ボタン。空はスキップ。非同期。待ち中もフォーカス可。失敗時は旧判定を残す
- [x] `HanteiView` — 適切＋指摘、不適切＋ヒント＋意味/文法。訳全文を出さない
- [x] 成功したらその文の判定を上書き保存

完了: 4言語それぞれで、適切な訳と、動詞なしの訳を1回ずつ判定し、表示が仕様どおり。

## 6. 操作の通し

- [x] Tab = 判定して次（空なら判定せず次）
- [x] Ctrl+Enter とボタン = 判定して残る
- [x] 判定中の文に「判定中」
- [x] やり直しで上書きされること
- [x] 一覧から戻った文の判定が見えること

完了: ニュース短文を貼り、英語で3文以上を、Tab だけで判定しながら通せる。

## 7. 仕上げ

- [x] 中国語（簡体）・韓国語・ドイツ語でも、6 と同じ通しを1原文ずつ
- [x] 14B に切り替えて1回判定できる
- [x] `pnpm dead-code` で、テスト以外の死にコードを残さない
- [x] `graphify update .`
- [x] `progress.md` を「v1 実装済み」に更新する

完了: 上を手で確認し、未チェックが無い。

## 後回し（v1 に入れない）

- 振り返り、模範解答
- OpenAI 互換キー
- Web / Go API
- 繁体、ファイル／URL 取り込み
