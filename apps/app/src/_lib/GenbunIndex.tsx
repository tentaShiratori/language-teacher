import { GAKUSHU_GENGO_HYOJI, type GakushuGengo } from "./gakushu_gengo";
import type { GenbunSummary } from "./store";

function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }
  return date.toLocaleString("ja-JP");
}

function gengoLabel(gengo: string): string {
  if (gengo in GAKUSHU_GENGO_HYOJI) {
    return GAKUSHU_GENGO_HYOJI[gengo as GakushuGengo];
  }
  return gengo;
}

export function GenbunIndex({
  items,
  onOpen,
  onDelete,
}: {
  items: GenbunSummary[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="genbun-index" aria-label="原文一覧">
      <h2>過去の原文</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="genbun-index-item">
            <button type="button" className="genbun-index-open" onClick={() => onOpen(item.id)}>
              <span className="genbun-index-line">{item.firstLine || "(空)"}</span>
              <span className="genbun-index-meta">
                {gengoLabel(item.gakushuGengo)} · {formatCreatedAt(item.createdAt)}
              </span>
            </button>
            <button type="button" className="genbun-index-delete" onClick={() => onDelete(item.id)}>
              消す
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
