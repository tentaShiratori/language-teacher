import { mergeBun, resplitBun, splitBun, type Bun } from "./bun";
import type { GakushuGengo } from "./gakushu_gengo";

export type GenbunPhase = "paste" | "gengo" | "henshu";

export type GenbunSession = {
  body: string;
  gakushuGengo: GakushuGengo | null;
  buns: Bun[];
  selectedIndex: number;
};

function toBun(body: string): Bun {
  return {
    body,
    yakubun: "",
    tekisetsu: null,
    imi: null,
    bunpo: null,
    shiteki: null,
    hinto: null,
  };
}

export function phaseOf(session: GenbunSession | null): GenbunPhase {
  if (session === null) {
    return "paste";
  }
  if (session.gakushuGengo === null) {
    return "gengo";
  }
  return "henshu";
}

/** 空の原文は受け付けない。 */
export function startGenbun(body: string): GenbunSession | null {
  if (body === "") {
    return null;
  }
  return {
    body,
    gakushuGengo: null,
    buns: [],
    selectedIndex: 0,
  };
}

/** 学習言語は一度選んだら変えない。 */
export function selectGengo(session: GenbunSession, gengo: GakushuGengo): GenbunSession {
  if (session.gakushuGengo !== null) {
    return session;
  }
  const buns = splitBun(session.body).map(toBun);
  return {
    ...session,
    gakushuGengo: gengo,
    buns,
    selectedIndex: 0,
  };
}

export function selectBun(session: GenbunSession, index: number): GenbunSession {
  if (index < 0 || index >= session.buns.length) {
    return session;
  }
  return { ...session, selectedIndex: index };
}

/** 次の文へ。末尾では動かない。 */
export function selectNextBun(session: GenbunSession): GenbunSession {
  if (session.buns.length === 0) {
    return session;
  }
  const next = Math.min(session.selectedIndex + 1, session.buns.length - 1);
  return { ...session, selectedIndex: next };
}

export function setYakubun(session: GenbunSession, yakubun: string): GenbunSession {
  const index = session.selectedIndex;
  if (index < 0 || index >= session.buns.length) {
    return session;
  }
  const target = session.buns[index]!;
  const nextBun: Bun = { ...target, yakubun };
  return {
    ...session,
    buns: [...session.buns.slice(0, index), nextBun, ...session.buns.slice(index + 1)],
  };
}

export function mergeSelected(session: GenbunSession): GenbunSession {
  const buns = mergeBun(session.buns, session.selectedIndex);
  const max = Math.max(0, buns.length - 1);
  return {
    ...session,
    buns,
    selectedIndex: Math.min(session.selectedIndex, max),
  };
}

export function resplitSelected(session: GenbunSession, caret: number): GenbunSession {
  return {
    ...session,
    buns: resplitBun(session.buns, session.selectedIndex, caret),
  };
}
