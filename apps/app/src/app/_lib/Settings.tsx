import { useState, type FormEvent } from "react";
import { isOllamaModel, OLLAMA_MODELS, type Settings as SettingsValue } from "../../lib/ollama";
import { openHanteiLogMado } from "../../lib/openHanteiLogMado";

export function Settings({
  value,
  onSave,
}: {
  value: SettingsValue;
  onSave: (settings: SettingsValue) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="settings">
      <button type="button" className="settings-toggle" onClick={() => setOpen((prev) => !prev)}>
        {open ? "設定を閉じる" : "設定"}
      </button>
      {open ? (
        <>
          <SettingsForm
            key={`${value.ollamaBaseUrl}:${value.ollamaModel}`}
            value={value}
            onSave={onSave}
          />
          <button
            type="button"
            className="settings-log-toggle"
            onClick={() => {
              void openHanteiLogMado();
            }}
          >
            判定ログ
          </button>
        </>
      ) : null}
    </section>
  );
}

function SettingsForm({
  value,
  onSave,
}: {
  value: SettingsValue;
  onSave: (settings: SettingsValue) => void | Promise<void>;
}) {
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(value.ollamaBaseUrl);
  const [ollamaModel, setOllamaModel] = useState(value.ollamaModel);
  const canSubmit = ollamaBaseUrl.trim() !== "" && ollamaModel.trim() !== "";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    void onSave({
      ollamaBaseUrl: ollamaBaseUrl.trim(),
      ollamaModel: ollamaModel.trim(),
    });
  }

  return (
    <form className="settings-form" onSubmit={onSubmit}>
      <label htmlFor="ollama-base-url">Ollama の URL</label>
      <input
        id="ollama-base-url"
        type="text"
        value={ollamaBaseUrl}
        onChange={(event) => setOllamaBaseUrl(event.currentTarget.value)}
      />
      <label htmlFor="ollama-model">モデル</label>
      <select
        id="ollama-model"
        value={ollamaModel}
        onChange={(event) => setOllamaModel(event.currentTarget.value)}
      >
        {OLLAMA_MODELS.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
        {!isOllamaModel(ollamaModel) ? <option value={ollamaModel}>{ollamaModel}</option> : null}
      </select>
      <button type="submit" disabled={!canSubmit}>
        保存
      </button>
    </form>
  );
}
