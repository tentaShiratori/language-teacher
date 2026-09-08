/** 不適切時に訳文上で示す位置。文字は Unicode スカラー値の 0 始まり。 */
export type Kasho =
  | { shurui: "ketsujo"; index: number }
  | { shurui: "ayamari"; start: number; end: number };

/** 表示用の一列。欠けは文字の間（または両端）に挟む。 */
export type KashoCol = { shurui: "moji"; moji: string; ayamari: boolean } | { shurui: "ketsujo" };

function yakubunCharCount(yakubun: string): number {
  return [...yakubun].length;
}

/** 範囲外・逆転・未知形を捨てる。適切なら空にする。 */
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
    if (item.shurui === "ketsujo") {
      if (Number.isInteger(item.index) && item.index >= 0 && item.index <= len) {
        out.push({ shurui: "ketsujo", index: item.index });
      }
      continue;
    }
    if (item.shurui === "ayamari") {
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
  }
  return out;
}

/** 訳文と箇所から、文字列と欠けの `^` 用の列を作る。 */
export function buildKashoCols(yakubun: string, kasho: readonly Kasho[]): KashoCol[] {
  const chars = [...yakubun];
  const cover = chars.map(() => false);
  const ketsujoAt = new Set<number>();

  for (const item of kasho) {
    if (item.shurui === "ketsujo") {
      ketsujoAt.add(item.index);
      continue;
    }
    for (let i = item.start; i < item.end; i++) {
      cover[i] = true;
    }
  }

  const cols: KashoCol[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (ketsujoAt.has(i)) {
      cols.push({ shurui: "ketsujo" });
    }
    cols.push({ shurui: "moji", moji: chars[i]!, ayamari: cover[i]! });
  }
  if (ketsujoAt.has(chars.length)) {
    cols.push({ shurui: "ketsujo" });
  }
  return cols;
}
