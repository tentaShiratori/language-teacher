# e2e（WebDriver）

Tauri の [WebDriver](https://v2.tauri.app/ja/develop/tests/webdriver/) と WebdriverIO で、リリースバイナリを実ウィンドウとして通す。Vitest（`pnpm test run {ファイル名}`）とは別コマンド。

デスクトップは Linux と Windows だけ。macOS は WKWebView ドライバが無い。CI の Linux 実行は [e2e ワークフロー](../.github/workflows/e2e.yml) を `workflow_dispatch` で手動起動する。ローカルは Windows。判定（Ollama）はこの spec では打たない。

## 実行

```bash
pnpm --filter @language-teacher/app e2e
```

`apps/app/e2e/wdio.conf.ts` の `onPrepare` がフロントの `pnpm build` と `apps/app/src-tauri` の `cargo build --release` を走る。起動するバイナリは `tauri:options.application`（`language_teacher` / `language_teacher.exe`）。

## Windows（ローカル）

1. `cargo install tauri-driver --locked`
2. Edge の版を確認する

```powershell
(Get-Item "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe").VersionInfo.ProductVersion
```

3. 同じ版の [Microsoft Edge WebDriver](https://developer.microsoft.com/microsoft-edge/tools/webdriver/) から `msedgedriver.exe` を取る。`tauri-driver` は PATH 上の `msedgedriver` を探す。版が違うとセッション開始で止まる。PATH に出さないときは `tauri-driver --native-driver` でパスを渡す
4. 上の実行コマンドを叩く
