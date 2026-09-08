import type { Hantei } from "../bindings/Hantei";

export type { Hantei } from "../bindings/Hantei";

/** 訳文が空なら LLM を呼ばない。 */
function shouldCallHantei(yakubun: string): boolean {
  return yakubun !== "";
}

/**
 * 応答を仕様どおりに直す。
 * `tekisetsu` は `imi && bunpo` に合わせ、不適切なら shiteki、適切なら hinto を捨てる。
 */
function normalizeHantei(raw: Hantei): Hantei {
  const tekisetsu = raw.imi && raw.bunpo;
  return {
    tekisetsu,
    imi: raw.imi,
    bunpo: raw.bunpo,
    shiteki: tekisetsu ? raw.shiteki : null,
    hinto: tekisetsu ? null : raw.hinto,
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
