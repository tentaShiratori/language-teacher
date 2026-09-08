import { useState, type FormEvent } from "react";

export function GenbunPaste({ onPaste }: { onPaste: (body: string) => void }) {
  const [body, setBody] = useState("");
  const canSubmit = body !== "";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onPaste(body);
  }

  return (
    <form className="genbun-paste" onSubmit={onSubmit}>
      <label htmlFor="genbun-body">原文</label>
      <textarea
        id="genbun-body"
        value={body}
        onChange={(event) => setBody(event.currentTarget.value)}
        rows={8}
        placeholder="母語の原文を貼る"
      />
      <button type="submit" disabled={!canSubmit}>
        進む
      </button>
    </form>
  );
}
