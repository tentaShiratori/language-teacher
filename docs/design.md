# 設計

自分用の言語教師。母語の原文を貼り、学習言語へ一文ずつ訳し、判定する。[CONTEXT.md](../CONTEXT.md) の語だけを使う。v1 の面は Tauri のみ（[ADR 0001](./adr/0001-tauri-only-no-go-api.md)）。

## 範囲

やる。

- 原文を貼る（ニュースでも作文でもよい）
- 学習言語を原文に対して一つ選ぶ（英語 / 中国語・簡体 / 韓国語 / ドイツ語）
- 文への自動分割、境界の目印、結合と再分割
- 文を選んで訳文を書く
- 判定（[hantei.md](./hantei.md)）
- 原文・訳文・判定を端末に残す
- 過去の原文を開き直す
- Ollama 未導入時は、画面に [ollama.md](./ollama.md) と同じ手順を出す

やらない。

- `apps/web` と `api`
- アカウント、同期、クラウド判定
- 模範解答の表示と保存
- 振り返り・弱点の集計
- URL 取り込み、ファイル取り込み
- 学習言語の途中変更、文ごとの言語
- 中国語の繁体
- OpenAI 互換キーの設定 UI

## 配置

`apps/app` に Tauri + React + Vite を置く。入口は `src/main.tsx` のみ。画面は `app/` 以下にルート単位。共有は `lib/`、ドメインは `model/`。画面専用は各画面の `_lib/`。テスト本体は対象の隣。`test/` はテスト専用ヘルパー用（無いときは作らない）。`features/` は新設しない。

名前は CONTEXT のローマ字。ケバブケースにしない。

```
apps/app/
  package.json
  index.html
  vite.config.ts
  src/
    main.tsx
    vite-env.d.ts
    bindings/          # ts-rs 生成物（手編集しない。コミットする）
    lib/               # 全体で使うコード（IPC・ルート・共有スタイル等）
      app.css
      appRoutes.tsx
      store.ts         # invoke 包み。型は bindings を再 export
      error_log.ts     # 未捕捉・握りつぶし → log_js_error
      ollama.ts
      openHanteiLogMado.ts
      *.test.ts
      *.test.tsx
    model/             # ドメインモデル・ドメインロジック
      bun.ts
      genbun.ts
      hantei.ts
      kasho.ts
      gakushu_gengo.ts
      *.test.ts
    app/
      App.tsx          # 本編（/）
      App.test.ts
      _lib/            # App.tsx 用
        GenbunPaste.tsx
        GakushuGengoSelect.tsx
        BunList.tsx
        YakubunField.tsx
        HanteiView.tsx
        KashoHyoji.tsx
        OllamaSetup.tsx
        GenbunIndex.tsx
        Settings.tsx
        useGenbun.ts
        useHantei.ts
        useOllama.ts
        *.test.ts
        *.test.tsx
      hantei-log/
        HanteiLogMado.tsx   # 判定ログ窓（/hantei-log）
        HanteiLogMado.test.tsx
        _lib/
          HanteiLogHyoji.tsx
          useHanteiLog.ts
          *.test.tsx
  src-tauri/
    tauri.conf.json
    Cargo.toml
    .cargo/config.toml # TS_RS_EXPORT_DIR → ../src/bindings
    src/
      lib.rs
      ollama.rs
      hantei.rs
      hantei_log.rs
      error_log.rs
      kasho.rs
      store.rs
```

### 共有型の更新（ts-rs）

IPC を跨ぐ型（`GenbunRecord` / `GenbunSummary` / `BunRecord` / `Settings` / `OllamaStatus` / `Hantei` / `ErrorLogLine`）は Rust に `#[derive(TS)]` を付け、`serde(rename_all = "camelCase")` と揃える（[ADR 0003](./adr/0003-ts-rs-for-shared-types.md)）。`#[ts(export)]` は付けない（`cargo test` が TypeScript を書いて stop hook がループするため）。

1. `apps/app/src-tauri` で `cargo export-bindings` を走らせる（`cargo test` では出さない）
2. `apps/app/src/bindings/` に TypeScript が書き出される
3. 生成物の差分をコミットする。フロントの `invoke` 包み（`store.ts`）は残す

Rust のコマンド（IPC）は次だけ。保存の中身はコマンドの向こうに閉じる。

| コマンド                          | すること                                       |
| --------------------------------- | ---------------------------------------------- |
| `ollama_status`                   | 到達性と、設定モデルの有無                     |
| `hantei_bun`                      | 原文全体と対象の文と訳文を渡し、判定を返す     |
| `save_genbun`                     | 原文・文・訳文・判定を書く                     |
| `list_genbun`                     | 過去の原文の一覧                               |
| `load_genbun`                     | 一件を読む                                     |
| `delete_genbun`                   | 一件を消す                                     |
| `load_settings` / `save_settings` | Ollama の URL とモデル名                       |
| `list_hantei_log`                 | 判定ログを新しい順に返す（保存の中身は向こう） |
| `log_js_error`                    | JS のエラー行を `error_js.jsonl` へ追記        |

SQLite はアプリデータディレクトリ。スキーマは `store.rs` が持つ。判定のやり取りログはファイル。

エラーログは判定ログと別。アプリデータディレクトリに `error_rust.jsonl`（コマンドの `Err` と panic）と `error_js.jsonl`（未捕捉と握りつぶした catch）。1行の形は `ErrorLogLine`（`at` / `message` / `stack`。`stack` は null 可）。

## データ

原文は学習言語を一つ持つ。文は順序を持つ。判定は今の訳文に対する一つだけで、やり直しは上書き。

```text
genbun
  id
  body
  gakushu_gengo   en | zh_hans | ko | de
  created_at

bun
  id
  genbun_id
  position
  body
  yakubun         空文字可
  tekisetsu       0 | 1 | null
  imi             0 | 1 | null
  bunpo           0 | 1 | null
  shiteki         null 可
  hinto           null 可
  kasho           JSON 配列。未判定・適切は []

settings
  ollama_base_url
  ollama_model      既定 qwen3:8b
```

`tekisetsu` が null は未判定。`kasho` の形は [hantei.md](./hantei.md) の箇所。

## 画面

本編ウィンドウと、設定から開く判定ログ用の第2ウィンドウ。同じ SPA を `react-router` の Hash 履歴で分ける（[ADR 0004](./adr/0004-react-router-hash.md)）。ログインは無い。判定ログウィンドウはログ表示だけを持ち、本編の編集状態は持たない。同じラベルのウィンドウが既にあれば前面に出す。

### 起動

1. `ollama_status` を呼ぶ
2. 失敗なら全面に `OllamaSetup`（[ollama.md](./ollama.md) の手順。届かない／モデル無しで文言を分ける）。判定は無効
3. 成功なら、過去の原文一覧（無ければ貼り付けへ）

### 貼り付け

- テキストエリアに原文を貼る
- 空では進めない
- 直後に学習言語を選ぶ。選ぶまで文の編集に入らない
- 一度選んだら、その原文では変えない

### 文の編集

- 原文を自動分割し、文の境に目印を置く
- クリック、または Tab で文を選ぶ
- 選んだ文の下（または横）に訳文欄を出し、フォーカスする
- 他の文は、既に書いた訳文があれば折りたたんで見せてよい。未選択の欄は出さない

分割の初期規則（純関数 `splitBun`）。

- `。` `！` `？` `．` のあとで切る
- 改行だけでも切る
- 空の断片は捨てる
- 鉤括弧の内側も同じ規則で切る。誤ったら結合する

結合: 隣り合う文を一つにする。再分割: 選んだ文の、キャレット位置で二つにする。分割し直した結果は未判定に戻す。

### 判定の起動

訳文が空なら LLM を呼ばない。

| 操作       | 判定                 | フォーカス                                           |
| ---------- | -------------------- | ---------------------------------------------------- |
| Tab        | する（空ならしない） | 次の文へ。末尾なら一覧の外へ出ない（最後の文に残る） |
| Ctrl+Enter | する                 | その文                                               |
| 判定ボタン | する                 | その文                                               |

判定は非同期。待ち中もフォーカスは動く。待ち中の文は「判定中」を出す。失敗したらその文にエラーを出し、前の判定があれば残す（上書きしない）。成功したらその文の判定を上書きし、保存する。

Ollama が途中で落ちたら、その回は失敗。次の起動時検知まで、失敗のたびに同じエラーでよい。設定を開いて保存したら、再検知する。

### 判定の表示

- 適切: 「適切」と、指摘があれば指摘
- 不適切: 「不適切」とヒント。意味／文法のどちらが欠けたかは出してよい（`imi` / `bunpo`）。訳の全文は出さない。箇所があれば、誤った単語に赤い波線を出す（[hantei.md](./hantei.md)）

### 一覧と設定

- 一覧は原文の先頭行と学習言語と日時
- 開くと、文・訳文・判定が戻る
- 消せる
- 設定: Ollama の URL、モデル（`qwen3:8b` / `qwen3:14b`）。保存後に再検知。判定ログはボタンから別ウィンドウで開く（パネル内には埋め込まない）

## 状態の流れ

貼る → 学習言語 → 分割 → （結合／再分割）→ 訳す → 判定 → SQLite。一覧から同じ流れの途中に戻る。

新しい原文を貼るときは新しい `genbun` を作る。編集中の内容は、判定成功のほか、訳文の確定（Ctrl+Enter、ボタン、文を離れる Tab）でも保存する。空の訳文への Tab は、判定せずに進み、空を保存する。
