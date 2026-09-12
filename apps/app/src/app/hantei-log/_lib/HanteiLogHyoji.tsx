import type { Hantei } from "../../../model/hantei";
import type { HanteiLogLine } from "../../../lib/store";

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
  return (
    <div className={hantei.tekisetsu ? "hantei-log-parse-ok" : "hantei-log-parse-ng"}>
      <p className="hantei-kekka">{hantei.tekisetsu ? "適切" : "不適切"}</p>
      {hantei.shiteki !== null && hantei.shiteki !== "" ? (
        <p className="hantei-shiteki">{hantei.shiteki}</p>
      ) : null}
      {hantei.naoshitaYakubun !== null && hantei.naoshitaYakubun !== "" ? (
        <p className="hantei-naoshita" aria-label={hantei.tekisetsu ? "自然な訳文" : "直した訳文"}>
          {hantei.naoshitaYakubun}
        </p>
      ) : null}
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
