import { describe, expect, test } from "vitest";
import {
  applyHantei,
  mergeSelected,
  phaseOf,
  resplitSelected,
  selectBun,
  selectGengo,
  selectNextBun,
  setYakubun,
  startGenbun,
  type GenbunSession,
} from "./genbun";

function emptyBun(body: string) {
  return {
    body,
    yakubun: "",
    tekisetsu: null as boolean | null,
    imi: null as boolean | null,
    bunpo: null as boolean | null,
    shiteki: null as string | null,
    hinto: null as string | null,
    kasho: [],
  };
}

function henshuSession(overrides: Partial<GenbunSession> = {}): GenbunSession {
  return {
    id: "session-1",
    body: "あ。い。う。",
    gakushuGengo: "en",
    createdAt: "2026-09-08T00:00:00.000Z",
    buns: [emptyBun("あ。"), emptyBun("い。"), emptyBun("う。")],
    selectedIndex: 0,
    ...overrides,
  };
}

describe("phaseOf / startGenbun", () => {
  test("未開始は paste", () => {
    expect(phaseOf(null)).toBe("paste");
  });

  test("言語未選択は gengo", () => {
    expect(phaseOf(startGenbun("あ。"))).toBe("gengo");
  });

  test("言語選択後は henshu", () => {
    const session = selectGengo(startGenbun("あ。")!, "en", "id-1", "2026-09-08T00:00:00.000Z");
    expect(phaseOf(session)).toBe("henshu");
  });

  test("原文を受け付ける", () => {
    expect(startGenbun("こんにちは。")?.body).toBe("こんにちは。");
    expect(startGenbun("こんにちは。")?.id).toBeNull();
  });

  test("空文字は拒否する", () => {
    expect(startGenbun("")).toBeNull();
  });
});

describe("selectGengo", () => {
  test("分割して編集に入る", () => {
    const session = selectGengo(startGenbun("あ。い。")!, "ko", "id-2", "2026-09-08T01:00:00.000Z");
    expect(session.gakushuGengo).toBe("ko");
    expect(session.id).toBe("id-2");
    expect(session.buns.map((bun) => bun.body)).toEqual(["あ。", "い。"]);
  });

  test("一度選んだら変えない", () => {
    const first = selectGengo(startGenbun("あ。")!, "en", "id-3", "2026-09-08T00:00:00.000Z");
    expect(selectGengo(first, "de").gakushuGengo).toBe("en");
  });
});

describe("selectBun / selectNextBun", () => {
  test("範囲内の文を選ぶ", () => {
    expect(selectBun(henshuSession(), 2).selectedIndex).toBe(2);
  });

  test("範囲外は動かない", () => {
    const session = henshuSession();
    expect(selectBun(session, -1)).toEqual(session);
  });

  test("Tab 相当で次へ進む", () => {
    expect(selectNextBun(henshuSession({ selectedIndex: 0 })).selectedIndex).toBe(1);
  });

  test("末尾では動かない", () => {
    expect(selectNextBun(henshuSession({ selectedIndex: 2 })).selectedIndex).toBe(2);
  });

  test("文が空なら動かない", () => {
    const session = henshuSession({ buns: [], selectedIndex: 0 });
    expect(selectNextBun(session)).toEqual(session);
  });
});

describe("setYakubun", () => {
  test("選択中の訳文を更新する", () => {
    expect(setYakubun(henshuSession({ selectedIndex: 1 }), "yes").buns[1]?.yakubun).toBe("yes");
  });

  test("選択が無効なら変えない", () => {
    const session = henshuSession({ selectedIndex: 9 });
    expect(setYakubun(session, "x")).toEqual(session);
  });

  test("空の訳文も保持する", () => {
    expect(setYakubun(setYakubun(henshuSession(), "hello"), "").buns[0]?.yakubun).toBe("");
  });
});

describe("mergeSelected / resplitSelected", () => {
  test("選択中と次を結合する", () => {
    expect(mergeSelected(henshuSession()).buns.map((bun) => bun.body)).toEqual([
      "あ。い。",
      "う。",
    ]);
  });

  test("末尾では結合しない", () => {
    const session = henshuSession({ selectedIndex: 2 });
    expect(mergeSelected(session).buns).toEqual(session.buns);
  });

  test("キャレット位置で再分割する", () => {
    const session = henshuSession({
      buns: [{ ...emptyBun("あいう"), yakubun: "x", tekisetsu: true, imi: true, bunpo: true }],
      selectedIndex: 0,
    });
    const next = resplitSelected(session, 1);
    expect(next.buns.map((bun) => bun.body)).toEqual(["あ", "いう"]);
    expect(next.buns.every((bun) => bun.yakubun === "")).toBe(true);
  });

  test("キャレット先頭では再分割しない", () => {
    const session = henshuSession();
    expect(resplitSelected(session, 0).buns).toEqual(session.buns);
  });
});

describe("applyHantei", () => {
  const ok = { tekisetsu: true, imi: true, bunpo: true, shiteki: "指摘", hinto: null, kasho: [] };
  const ng = { tekisetsu: false, imi: false, bunpo: true, shiteki: null, hinto: "旧", kasho: [] };

  test("指定した文の判定を上書きする", () => {
    const second = applyHantei(applyHantei(henshuSession(), 0, ng), 0, ok);
    expect(second.buns[0]?.tekisetsu).toBe(true);
    expect(second.buns[0]?.shiteki).toBe("指摘");
    expect(second.buns[0]?.hinto).toBeNull();
    expect(second.buns[1]?.tekisetsu).toBeNull();
  });

  test("範囲外は変えない", () => {
    const session = henshuSession();
    expect(applyHantei(session, 9, ok)).toEqual(session);
  });
});
