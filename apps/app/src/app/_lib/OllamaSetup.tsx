import { setupLead, type OllamaStatus } from "../../lib/ollama";

export function OllamaSetup({
  status,
  onRecheck,
}: {
  status: OllamaStatus;
  onRecheck: () => void;
}) {
  if (status.kind === "ok") {
    return null;
  }

  const lead = setupLead(status);
  const showInstall = status.kind === "unreachable";
  const showPull = status.kind === "unreachable" || status.kind === "modelMissing";
  const model = status.kind === "modelMissing" ? status.model : "qwen3:8b";

  return (
    <section className="ollama-setup" aria-live="polite">
      <h2>Ollama の準備</h2>
      {lead !== null ? <p className="ollama-setup-lead">{lead}</p> : null}

      {showInstall ? (
        <ol>
          <li>
            <a href="https://ollama.com/download/windows" target="_blank" rel="noreferrer">
              Ollama for Windows
            </a>
            を入れて完了する。トレイに Ollama がいれば起動している。
          </li>
          <li>
            mise の入ったターミナルでモデルを取る。
            <pre>
              <code>{`ollama pull ${model}`}</code>
            </pre>
          </li>
          <li>
            応答を確かめる。
            <pre>
              <code>{`ollama run ${model}`}</code>
            </pre>
            日本語で短い質問を打ち、返事が返ればよい。抜けるのは <code>/bye</code>。
          </li>
          <li>
            HTTP 口は既定で <code>http://127.0.0.1:11434</code>。アプリの設定が空ならこの URL
            を使う。
            <pre>
              <code>ollama list</code>
            </pre>
            <code>{model}</code> が一覧にあれば、アプリから叩ける。
          </li>
        </ol>
      ) : null}

      {showPull && status.kind === "modelMissing" ? (
        <ol>
          <li>
            mise の入ったターミナルでモデルを取る。
            <pre>
              <code>{`ollama pull ${model}`}</code>
            </pre>
          </li>
          <li>
            一覧を確認する。
            <pre>
              <code>ollama list</code>
            </pre>
            タグ名が設定の文字列と一致するか見る。アプリは <code>ollama pull</code> を代行しない。
          </li>
        </ol>
      ) : null}

      <button type="button" onClick={onRecheck}>
        再確認
      </button>
    </section>
  );
}
