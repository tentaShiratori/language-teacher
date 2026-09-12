import type { Hantei } from "../bindings/Hantei";

export type { Hantei } from "../bindings/Hantei";

/** 訳文が空なら LLM を呼ばない。 */
function shouldCallHantei(yakubun: string): boolean {
  return yakubun !== "";
}

/**
 * 応答を仕様どおりに直す。
 * `tekisetsu` は `imi && bunpo` に合わせ、不適切でも shiteki を残す。
 */
function normalizeHantei(raw: Hantei): Hantei {
  return {
    tekisetsu: raw.imi && raw.bunpo,
    imi: raw.imi,
    bunpo: raw.bunpo,
    shiteki: raw.shiteki,
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
