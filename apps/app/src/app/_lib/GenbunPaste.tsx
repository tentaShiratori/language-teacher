import { useState, type FormEvent } from "react";
import { InyoMotoField } from "./InyoMotoField";

export function GenbunPaste({ onPaste }: { onPaste: (body: string, inyoMoto: string) => void }) {
  const [body, setBody] = useState("");
  const [inyoMoto, setInyoMoto] = useState("");
  const canSubmit = body !== "";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onPaste(body, inyoMoto);
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
      <InyoMotoField id="inyo-moto-paste" value={inyoMoto} onChange={setInyoMoto} />
      <button type="submit" disabled={!canSubmit}>
        進む
      </button>
    </form>
  );
}
