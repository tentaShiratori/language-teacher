import { HanteiLogHyoji } from "./_lib/HanteiLogHyoji";
import { useHanteiLog } from "./_lib/useHanteiLog";

export function HanteiLogMado() {
  const { items, status } = useHanteiLog();

  return (
    <main className="app hantei-log-mado">
      <h1>判定ログ</h1>
      {status === "loading" ? <p className="hantei-log-loading">読み込み中…</p> : null}
      {status === "error" ? <p className="hantei-log-load-error">ログを読めませんでした</p> : null}
      {status === "ok" ? <HanteiLogHyoji items={items} /> : null}
    </main>
  );
}
