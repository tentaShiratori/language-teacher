import type { Bun } from "../../model/bun";

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

  const kekka = tekisetsu ? "適切" : futekisetsu ? "不適切" : null;
  const hasShiteki = bun.shiteki !== null && bun.shiteki !== "";
  const hasNaoshita = bun.naoshitaYakubun !== null && bun.naoshitaYakubun !== "";

  return (
    <div className="hantei-view">
      {pending ? <p className="hantei-pending">判定中</p> : null}
      {error !== null ? <p className="hantei-error">{error}</p> : null}
      {kekka !== null ? (
        <div className={tekisetsu ? "hantei-tekisetsu" : "hantei-futekisetsu"}>
          <p className="hantei-kekka">{kekka}</p>
          {hasShiteki ? <p className="hantei-shiteki">{bun.shiteki}</p> : null}
          {hasNaoshita ? (
            <p className="hantei-naoshita" aria-label={tekisetsu ? "自然な訳文" : "直した訳文"}>
              {bun.naoshitaYakubun}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
