import type { Bun } from "../../model/bun";
import { KashoHyoji } from "./KashoHyoji";

export function HanteiView({
  bun,
  pending,
  error,
}: {
  bun: Bun;
  pending: boolean;
  error: string | null;
}) {
  const tekisetsu = bun.tekisetsu === true;
  const futekisetsu = bun.tekisetsu === false;
  if (!pending && error === null && !tekisetsu && !futekisetsu) {
    return null;
  }

  return (
    <div className="hantei-view">
      {pending ? <p className="hantei-pending">判定中</p> : null}
      {error !== null ? <p className="hantei-error">{error}</p> : null}
      {tekisetsu ? (
        <div className="hantei-tekisetsu">
          <p className="hantei-kekka">適切</p>
          {bun.shiteki !== null && bun.shiteki !== "" ? (
            <p className="hantei-shiteki">{bun.shiteki}</p>
          ) : null}
        </div>
      ) : null}
      {futekisetsu ? (
        <div className="hantei-futekisetsu">
          <p className="hantei-kekka">不適切</p>
          <KashoHyoji yakubun={bun.yakubun} kasho={bun.kasho} />
          {bun.hinto !== null && bun.hinto !== "" ? (
            <p className="hantei-hinto">{bun.hinto}</p>
          ) : null}
          <ul className="hantei-ketsujo">
            {bun.imi === false ? <li>意味</li> : null}
            {bun.bunpo === false ? <li>文法</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
