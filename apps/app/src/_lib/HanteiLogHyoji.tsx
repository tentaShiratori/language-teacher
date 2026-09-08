import type { Hantei } from "./hantei";
import type { HanteiLogLine } from "./store";

function formatAt(at: string): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) {
    return at;
  }
  return date.toLocaleString("ja-JP");
}

function ParseKekka({ hantei, error }: { hantei?: Hantei | null; error?: string | null }) {
  if (error !== undefined && error !== null && error !== "") {
    return <p className="hantei-log-parse-error">パース失敗: {error}</p>;
  }
  if (hantei === undefined || hantei === null) {
    return <p className="hantei-log-parse-empty">パース結果なし</p>;
  }
  if (hantei.tekisetsu) {
    return (
      <div className="hantei-log-parse-ok">
        <p className="hantei-kekka">適切</p>
        {hantei.shiteki !== null && hantei.shiteki !== "" ? (
          <p className="hantei-shiteki">{hantei.shiteki}</p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="hantei-log-parse-ng">
      <p className="hantei-kekka">不適切</p>
      {hantei.hinto !== null && hantei.hinto !== "" ? (
        <p className="hantei-hinto">{hantei.hinto}</p>
      ) : null}
      <ul className="hantei-ketsujo">
        {hantei.imi === false ? <li>意味</li> : null}
        {hantei.bunpo === false ? <li>文法</li> : null}
      </ul>
    </div>
  );
}

export function HanteiLogHyoji({ items }: { items: HanteiLogLine[] }) {
  if (items.length === 0) {
    return (
      <section className="hantei-log-hyoji" aria-label="判定ログ">
        <p className="hantei-log-empty">ログはまだありません</p>
      </section>
    );
  }

  return (
    <section className="hantei-log-hyoji" aria-label="判定ログ">
      <ul>
        {items.map((item, index) => (
          <li key={`${item.at}-${index}`} className="hantei-log-item">
            <p className="hantei-log-meta">
              {formatAt(item.at)} · {item.model}
            </p>
            <div className="hantei-log-block">
              <h3>プロンプト</h3>
              <pre className="hantei-log-prompt">{item.systemPrompt}</pre>
              <pre className="hantei-log-prompt">{item.userPrompt}</pre>
            </div>
            <div className="hantei-log-block">
              <h3>応答</h3>
              {item.messageContent !== null && item.messageContent !== "" ? (
                <pre className="hantei-log-response">{item.messageContent}</pre>
              ) : (
                <p className="hantei-log-response-empty">応答なし</p>
              )}
            </div>
            <div className="hantei-log-block">
              <h3>パース結果</h3>
              <ParseKekka hantei={item.hantei} error={item.error} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
