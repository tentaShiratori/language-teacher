import type { Hantei } from "../bindings/Hantei";

export type { Hantei } from "../bindings/Hantei";

/** 訳文が空なら LLM を呼ばない。 */
function shouldCallHantei(yakubun: string): boolean {
  return yakubun !== "";
}

function nonempty(value: string | null): string | null {
  return value !== null && value !== "" ? value : null;
}

/**
 * 応答を仕様どおりに直す。
 * `tekisetsu` は `imi && bunpo` に合わせ、不適切でも shiteki を残す。
 * naoshitaYakubun は空でなければ残す（適切なら自然な訳文、不適切なら直した訳文）。
 */
function normalizeHantei(raw: Hantei): Hantei {
  const tekisetsu = raw.imi && raw.bunpo;
  return {
    tekisetsu,
    imi: raw.imi,
    bunpo: raw.bunpo,
    shiteki: raw.shiteki,
    naoshitaYakubun: nonempty(raw.naoshitaYakubun),
  };
}

/** 空なら呼ばず null。それ以外は run の結果を補正して返す。 */
export async function runHanteiIfNeeded(
  yakubun: string,
  run: () => Promise<Hantei>,
): Promise<Hantei | null> {
  if (!shouldCallHantei(yakubun)) {
    return null;
  }
  return normalizeHantei(await run());
}
