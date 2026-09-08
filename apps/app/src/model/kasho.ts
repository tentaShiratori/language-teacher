/** 不適切時に訳文上で示す誤りの範囲。文字は Unicode スカラー値の 0 始まり、半開区間 [start, end)。 */
export type Kasho = { shurui: "ayamari"; start: number; end: number };

/** 波線付き／なしの連続した断片。 */
export type KashoSegment = { text: string; ayamari: boolean };

function yakubunCharCount(yakubun: string): number {
  return [...yakubun].length;
}

/** 範囲外・逆転・ayamari 以外を捨てる。適切なら空にする。 */
export function normalizeKasho(
  yakubun: string,
  kasho: readonly Kasho[] | null | undefined,
  tekisetsu: boolean,
): Kasho[] {
  if (tekisetsu || kasho == null) {
    return [];
  }
  const len = yakubunCharCount(yakubun);
  const out: Kasho[] = [];
  for (const item of kasho) {
    if (item == null || typeof item !== "object") {
      continue;
    }
    if (item.shurui !== "ayamari") {
      continue;
    }
    if (
      Number.isInteger(item.start) &&
      Number.isInteger(item.end) &&
      item.start >= 0 &&
      item.start < item.end &&
      item.end <= len
    ) {
      out.push({ shurui: "ayamari", start: item.start, end: item.end });
    }
  }
  return out;
}

/** 訳文と箇所から、波線を付ける連続断片を作る。 */
export function buildKashoSegments(yakubun: string, kasho: readonly Kasho[]): KashoSegment[] {
  const chars = [...yakubun];
  if (chars.length === 0) {
    return [];
  }
  const cover = chars.map(() => false);
  for (const item of kasho) {
    for (let i = item.start; i < item.end; i++) {
      cover[i] = true;
    }
  }

  const segments: KashoSegment[] = [];
  for (let i = 0; i < chars.length;) {
    const ayamari = cover[i]!;
    let j = i + 1;
    while (j < chars.length && cover[j] === ayamari) {
      j += 1;
    }
    segments.push({ text: chars.slice(i, j).join(""), ayamari });
    i = j;
  }
  return segments;
}
