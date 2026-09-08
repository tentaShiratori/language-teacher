# progress

## 状態

issue #4（貼り付けと文一覧）を実装済み。`GenbunPaste` / `GakushuGengoSelect` / `BunList` / `YakubunField` / `useGenbun`。Ollama 無しで貼る → 言語 → 一文ずつ入力まで通る。`useGenbun.test.ts` 18 件パス。

## 意思決定

- 原文は貼るだけ。ニュースでも作文でもよい。判定は同じ（意味＋文法）。書き手らしさは指摘
- 自分用・中級。試験や仕事メールには寄せない
- 学習言語は原文に一つ。貼った直後に選ぶ。英・中（簡体のみ）・韓・独。途中変更しない
- 言語ごとの破綻ラインは `docs/hantei.md`
- 適切なら指摘。不適切ならヒントだけ。模範解答は出さない・残さない
- Tab = 判定して次。Ctrl+Enter とボタン = 判定して残る。空は LLM を呼ばない。判定は非同期
- 判定には原文全体を渡す。やり直しは上書き
- 原文・訳文・判定を端末に残す
- Tauri のみ（ADR 0001）。Ollama（ADR 0002）。既定 qwen3:8b、設定で 14b
- Ollama 未導入は起動時に検知し、アプリ上に `docs/ollama.md` と同じ手順を出す
- `splitBun` は `。！？．` の直後と改行で切る。鉤括弧内も同じ。空断片は捨てる
- `mergeBun` / `resplitBun` は判定フィールドを null に戻す。再分割時の訳文は両方空
- #4 時点では判定は未接続。Tab は次の文へ（末尾は留まる）。Ctrl+Enter は選択を動かさないだけ

## 次セッション

- `docs/TODO.md` の 3（保存）へ
