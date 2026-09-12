import type { BunRecord } from "../bindings/BunRecord";

/** IPC の `BunRecord` と同じ形。文編集の純関数ではこの名前を使う。 */
export type Bun = BunRecord;

const KUKEN = new Set(["。", "！", "？", "．"]);

function miseitei(): Pick<Bun, "tekisetsu" | "imi" | "bunpo" | "shiteki"> {
  return {
    tekisetsu: null,
    imi: null,
    bunpo: null,
    shiteki: null,
  };
}

/** 原文を句点と改行で文の配列にする。空断片は捨てる。 */
export function splitBun(genbun: string): string[] {
  if (genbun === "") {
    return [];
  }

  const result: string[] = [];
  let current = "";

  const flush = () => {
    if (current !== "") {
      result.push(current);
      current = "";
    }
  };

  for (let i = 0; i < genbun.length; i++) {
    const ch = genbun[i]!;

    if (ch === "\r") {
      flush();
      if (genbun[i + 1] === "\n") {
        i += 1;
      }
      continue;
    }

    if (ch === "\n") {
      flush();
      continue;
    }

    current += ch;
    if (KUKEN.has(ch)) {
      flush();
    }
  }

  flush();
  return result;
}

/** 隣り合う文を一つにする。判定は捨てる。 */
export function mergeBun(buns: readonly Bun[], index: number): Bun[] {
  if (index < 0 || index >= buns.length - 1) {
    return [...buns];
  }

  const left = buns[index]!;
  const right = buns[index + 1]!;
  const merged: Bun = {
    body: left.body + right.body,
    yakubun: left.yakubun + right.yakubun,
    ...miseitei(),
  };

  return [...buns.slice(0, index), merged, ...buns.slice(index + 2)];
}

/** 選んだ文をキャレット位置で二つにする。判定は捨てる。 */
export function resplitBun(buns: readonly Bun[], index: number, caret: number): Bun[] {
  if (index < 0 || index >= buns.length) {
    return [...buns];
  }

  const target = buns[index]!;
  if (caret <= 0 || caret >= target.body.length) {
    return [...buns];
  }

  const left: Bun = {
    body: target.body.slice(0, caret),
    yakubun: "",
    ...miseitei(),
  };
  const right: Bun = {
    body: target.body.slice(caret),
    yakubun: "",
    ...miseitei(),
  };

  return [...buns.slice(0, index), left, right, ...buns.slice(index + 1)];
}
