# AI ハーネス設計メモ

`my-harness` は GitHub template 用の **共有 AI ハーネス**です。アプリコードは持たず、エージェントが同じやり方で動くための設定と最小ツールチェーンだけを置きます。

元にしたリポジトリ:

| 略称 | リポジトリ       | 主なスタック                        |
| ---- | ---------------- | ----------------------------------- |
| S    | slack-ai-agent   | TypeScript（Node webhook/worker）   |
| L    | language-teacher | TypeScript + Rust（Tauri）          |
| K    | kakeibo          | TypeScript + Go API + Rust（Tauri） |

---

## レイヤモデル

差分は次の3層に分ける。**コードは1本**（このテンプレ）に保ち、言語・面の差はドキュメントとプレースホルダで吸収する。

| レイヤ      | 何か         | 例                                                                                                | 扱い                       |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------- | -------------------------- |
| **shared**  | 言語非依存   | `mcp.json`、hooks 骨格、`testing.mdc` / `graphify.mdc`、grilling 系スキル、`AGENTS.md` のツール表 | テンプレのまま使う         |
| **stack**   | 言語・ビルド | `stop.ts` のゲート、`lefthook.yml`、mise の go/rust、`hook_env` の cargo PATH                     | 必要なときだけ足す（下表） |
| **product** | ドメイン・面 | `CONTEXT.md`、`architecture.mdc`、`react.mdc` の例、`add-feature` の面、`environment.json`        | `{{…}}` / TODO を埋める    |

誤コピーの典型は、**stack/product を shared だと思って別リポへ貼ること**（例: L に K の `apps/web` や入出金例が残る）。template 利用時は product を必ず scrub する。

---

## 比較から採ったもの

### shared（そのまま）

- `.cursor/mcp.json`（S ≡ L ≡ K）
- `.cursor/hooks.json` のイベント骨格（stop timeout は **300**＝S/L。重いゲート向き）
- hooks: `io` / `format` / `crg*` / `memory-session-start`
- rules: `testing.mdc` / `graphify.mdc`
- skills: `domain-modeling` / `grilling` / `grill-with-docs` / `write-test` + `skills-lock.json`
- `CLAUDE.md` → `@AGENTS.md`

### 最良ピース

| ピース                                              | 採用元         | 理由                                   |
| --------------------------------------------------- | -------------- | -------------------------------------- |
| `hook_env.ts`（CI=true・cargo PATH・win32 の Path） | L              | Windows / 非対話 / Rust で詰まらない   |
| AGENTS の「作業準備」+ graphify-out 注記            | S              | 起動手順が明確                         |
| Cloud `environment.json` / `install.sh` の形        | K              | 冪等・mise shim・graphify まで一気通貫 |
| `architecture` / `react` の方針                     | K/L の共通思想 | 例はプレースホルダ化                   |

### テンプレで意図的に変えた点

- **`stop.ts`**: 既定はルート `pnpm`（fmt/lint/typecheck/dead-code）。`apps/app/src-tauri` があるときだけ L と同じ cargo ゲートを追加。空の template で cargo/turbo が落ちないようにした
- **lefthook / mise**: TS 最小。Go/Rust ジョブやツールは下の「足し方」をコピーする
- **ドメイン語・面リスト**: すべて `{{…}}` / TODO（特定プロダクト名を持ち込まない）

---

## 言語・スタック差の吸収（足し方）

コードを分岐させず、**必要なブロックだけ足す**。

### TypeScript のみ（S 寄り・このテンプレ既定）

- mise: node / pnpm / uv / graphifyy / serena / lefthook / skills
- stop: ルート `pnpm` スクリプト
- lefthook: oxfmt + oxlint
- React が無ければ `.cursor/rules/react.mdc` を削除

### turbo モノレポ（L/K 寄り）

1. ルートに `turbo` を入れ、`package.json` の lint/typecheck/test を `turbo …` に変更
2. `stop.ts` の checks 先頭を例えば次に置き換え:

```ts
{
  command: process.execPath,
  args: [
    join(root, "node_modules", "turbo", "bin", "turbo"),
    "lint",
    "fmt:check",
    "typecheck",
    "//#dead-code",
    "test:run",
  ],
  cwd: root,
},
```

3. `pnpm-workspace.yaml` の `apps/*` / `packages/*` に実パッケージを置く

### Rust / Tauri（L）

1. `mise.toml` に `rust = { version = "…", components = "rustfmt,clippy" }`
2. `apps/app/src-tauri` を置く（置いた時点で現行 `stop.ts` が cargo を回す）
3. lefthook に rustfmt / clippy ジョブを追加（L の `lefthook.yml` 参照）
4. `hook_env.ts` はそのまま（cargo を PATH 先頭へ）

### Go API（K）

1. `mise.toml` に `go = "…"`
2. `architecture.mdc` の `api/internal` 構成を実ドメイン語に合わせる
3. lefthook に `gofmt` ジョブを追加
4. stop に `go test` / `go vet` を足すなら product の CI 方針と揃える（K 現状の stop は turbo のみ）

### Cloud Agent

1. `.cursor/environment.json` の `name` / terminals / ports を実プロダクトに合わせる
2. `.cursor/install.sh` の TODO（apt・typegen）を埋める。**他リポの install を無編集コピーしない**
3. 面が無いコマンド（例: `apps/web` が無いのに `next typegen`）は書かない

---

## Template 利用チェックリスト

Clone / 「Use this template」の直後に実施する。

### product（必須）

- [ ] `CONTEXT.md` の `{{PRODUCT}}` / Language 用語を埋める
- [ ] `AGENTS.md` の `{{BRANCH_SLUG_EXAMPLE}}` を CONTEXT のローマ字例に変える
- [ ] `.cursor/rules/architecture.mdc` の例語・パスをプロダクトに合わせる
- [ ] `.cursor/skills/add-feature/SKILL.md` の面が architecture と一致しているか確認
- [ ] React が無ければ `react.mdc` を削除。あれば例の `{{Feature}}` をドメイン語に置換
- [ ] `.cursor/environment.json` の name / command / description / port
- [ ] `.cursor/install.sh` の TODO
- [ ] `package.json` の `dev` スクリプト
- [ ] `progress.md` を初期状態に書き換える
- [ ] `README.md` をプロダクト説明に書き換える（このテンプレ説明は消してよい）

### stack（任意）

- [ ] Go / Rust / turbo が要るか決め、上の「足し方」を適用
- [ ] stop timeout（`hooks.json`）をゲートの重さに合わせる（軽いなら 60、重いなら 300）

### 動作確認

- [ ] `mise install && pnpm install`
- [ ] `pnpm hooks:test`
- [ ] `graphify update .`
- [ ] Cursor で sessionStart が `progress.md` を読むこと

---

## ファイルマップ

```
my-harness/
  AGENTS.md                 # shared + ブランチ例プレースホルダ
  CLAUDE.md                 # @AGENTS.md
  CONTEXT.md                # product プレースホルダ
  progress.md               # セッション記憶（フックが注入）
  docs/ai-harness.md        # 本ドキュメント
  mise.toml / lefthook.yml  # stack 最小（TS）
  package.json              # fmt/lint/typecheck/dead-code/hooks:test
  skills-lock.json          # mattpocock skills ピン
  .cursor/
    hooks.json / mcp.json
    environment.json / install.sh
    hooks/                  # L 基準 + template 向け stop
    rules/                  # testing, graphify, architecture, react
    skills/                 # domain-modeling, grilling, …
```

---

## メンテ方針

- shared を直すときは、このテンプレを正本にし、各プロダクトへ横展開する
- stack/product は **横展開しない**。各リポの実スタックに合わせて足す・削る
- 他リポからコピーした直後は、必ず「無い面・無いドメイン語・無いコマンド」が残っていないか grep する
