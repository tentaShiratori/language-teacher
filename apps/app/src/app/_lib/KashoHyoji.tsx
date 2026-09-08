<<<<<<< HEAD:apps/app/src/app/_lib/KashoHyoji.tsx
import { buildKashoCols, type Kasho } from "../../model/kasho";
=======
import { buildKashoSegments, type Kasho } from "./kasho";
>>>>>>> 54c3cff (fix: 箇所は波線のみにし、表示のずれを直す):apps/app/src/_lib/KashoHyoji.tsx

export function KashoHyoji({ yakubun, kasho }: { yakubun: string; kasho: readonly Kasho[] }) {
  if (kasho.length === 0) {
    return null;
  }

  const segments = buildKashoSegments(yakubun, kasho);

  return (
    <p className="kasho-hyoji" aria-label="箇所">
      {segments.map((segment, index) =>
        segment.ayamari ? (
          <span key={index} className="kasho-ayamari">
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
