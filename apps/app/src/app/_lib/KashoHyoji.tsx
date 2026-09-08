import { buildKashoCols, type Kasho } from "../../model/kasho";

export function KashoHyoji({ yakubun, kasho }: { yakubun: string; kasho: readonly Kasho[] }) {
  if (kasho.length === 0) {
    return null;
  }

  const cols = buildKashoCols(yakubun, kasho);

  return (
    <div className="kasho-hyoji" aria-label="箇所">
      {cols.map((col, index) => {
        if (col.shurui === "ketsujo") {
          return (
            <span key={`ketsujo-${index}`} className="kasho-col kasho-col-ketsujo">
              <span className="kasho-ch kasho-ch-pad" aria-hidden="true">
                {"\u00a0"}
              </span>
              <span className="kasho-mark" aria-hidden="true">
                ^
              </span>
            </span>
          );
        }
        return (
          <span
            key={`moji-${index}`}
            className={col.ayamari ? "kasho-col kasho-col-ayamari" : "kasho-col"}
          >
            <span className="kasho-ch">{col.moji === " " ? "\u00a0" : col.moji}</span>
            <span className="kasho-mark kasho-mark-empty" aria-hidden="true">
              {"\u00a0"}
            </span>
          </span>
        );
      })}
    </div>
  );
}
