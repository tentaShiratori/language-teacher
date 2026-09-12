import { mergeBun, resplitBun, splitBun, type Bun } from "./bun";
import type { GakushuGengo } from "./gakushu_gengo";
import type { Hantei } from "./hantei";
import { isGakushuGengo, type GenbunRecord } from "../lib/store";

export type GenbunPhase = "paste" | "gengo" | "henshu";

export type GenbunSession = {
  id: string | null;
  body: string;
  gakushuGengo: GakushuGengo | null;
  createdAt: string | null;
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
  };
}

function newGenbunId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

/** 保存できる状態ならレコードにする。 */
export function toRecord(session: GenbunSession): GenbunRecord | null {
  if (session.id === null || session.gakushuGengo === null || session.createdAt === null) {
    return null;
  }
  return {
    id: session.id,
    body: session.body,
    gakushuGengo: session.gakushuGengo,
    createdAt: session.createdAt,
    buns: session.buns,
  };
}

export function fromRecord(record: GenbunRecord): GenbunSession | null {
  if (!isGakushuGengo(record.gakushuGengo)) {
    return null;
  }
  return {
    id: record.id,
    body: record.body,
    gakushuGengo: record.gakushuGengo,
    createdAt: record.createdAt,
    buns: record.buns,
    selectedIndex: 0,
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
    id: null,
    body,
    gakushuGengo: null,
    createdAt: null,
    buns: [],
    selectedIndex: 0,
  };
}

/** 学習言語は一度選んだら変えない。選んだ時点で id を付けて保存対象にする。 */
export function selectGengo(
  session: GenbunSession,
  gengo: GakushuGengo,
  id: string = newGenbunId(),
  createdAt: string = nowIso(),
): GenbunSession {
  if (session.gakushuGengo !== null) {
    return session;
  }
  return {
    ...session,
    id,
    createdAt,
    gakushuGengo: gengo,
    buns: splitBun(session.body).map(toBun),
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
  return {
    ...session,
    buns: [
      ...session.buns.slice(0, index),
      { ...target, yakubun },
      ...session.buns.slice(index + 1),
    ],
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

/** 指定した文の判定を上書きする。 */
export function applyHantei(session: GenbunSession, index: number, hantei: Hantei): GenbunSession {
  if (index < 0 || index >= session.buns.length) {
    return session;
  }
  const target = session.buns[index]!;
  return {
    ...session,
    buns: [
      ...session.buns.slice(0, index),
      {
        ...target,
        tekisetsu: hantei.tekisetsu,
        imi: hantei.imi,
        bunpo: hantei.bunpo,
        shiteki: hantei.shiteki,
      },
      ...session.buns.slice(index + 1),
    ],
  };
}
