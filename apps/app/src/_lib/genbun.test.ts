import { describe, expect, test } from "vitest";
import {
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

function henshuSession(overrides: Partial<GenbunSession> = {}): GenbunSession {
  return {
    body: "あ。い。う。",
    gakushuGengo: "en",
    buns: [
      {
        body: "あ。",
        yakubun: "",
        tekisetsu: null,
        imi: null,
        bunpo: null,
        shiteki: null,
        hinto: null,
      },
      {
        body: "い。",
        yakubun: "",
        tekisetsu: null,
        imi: null,
        bunpo: null,
        shiteki: null,
        hinto: null,
      },
      {
        body: "う。",
        yakubun: "",
        tekisetsu: null,
        imi: null,
        bunpo: null,
        shiteki: null,
        hinto: null,
      },
    ],
    selectedIndex: 0,
    ...overrides,
  };
}

describe("phaseOf", () => {
  test("未開始は paste", () => {
    expect(phaseOf(null)).toBe("paste");
  });

  test("言語未選択は gengo", () => {
    expect(phaseOf(startGenbun("あ。"))).toBe("gengo");
  });

  test("言語選択後は henshu", () => {
    const session = selectGengo(startGenbun("あ。")!, "en");
    expect(phaseOf(session)).toBe("henshu");
  });
});

describe("startGenbun", () => {
  test("原文を受け付ける", () => {
    expect(startGenbun("こんにちは。")).toEqual({
      body: "こんにちは。",
      gakushuGengo: null,
      buns: [],
      selectedIndex: 0,
    });
  });

  test("空文字は拒否する", () => {
    expect(startGenbun("")).toBeNull();
  });
});

describe("selectGengo", () => {
  test("分割して編集に入る", () => {
    const session = selectGengo(startGenbun("あ。い。")!, "ko");
    expect(session.gakushuGengo).toBe("ko");
    expect(session.buns.map((bun) => bun.body)).toEqual(["あ。", "い。"]);
    expect(session.selectedIndex).toBe(0);
  });

  test("一度選んだら変えない", () => {
    const first = selectGengo(startGenbun("あ。")!, "en");
    const second = selectGengo(first, "de");
    expect(second.gakushuGengo).toBe("en");
  });
});

describe("selectBun / selectNextBun", () => {
  test("範囲内の文を選ぶ", () => {
    expect(selectBun(henshuSession(), 2).selectedIndex).toBe(2);
  });

  test("範囲外は動かない", () => {
    const session = henshuSession();
    expect(selectBun(session, -1)).toEqual(session);
    expect(selectBun(session, 3)).toEqual(session);
  });

  test("Tab 相当で次へ進む", () => {
    expect(selectNextBun(henshuSession({ selectedIndex: 0 })).selectedIndex).toBe(1);
  });

  test("末尾では動かない", () => {
    const session = henshuSession({ selectedIndex: 2 });
    expect(selectNextBun(session).selectedIndex).toBe(2);
  });

  test("文が空なら動かない", () => {
    const session = henshuSession({ buns: [], selectedIndex: 0 });
    expect(selectNextBun(session)).toEqual(session);
  });
});

describe("setYakubun", () => {
  test("選択中の訳文を更新する", () => {
    const next = setYakubun(henshuSession({ selectedIndex: 1 }), "yes");
    expect(next.buns[1]?.yakubun).toBe("yes");
    expect(next.buns[0]?.yakubun).toBe("");
  });

  test("選択が無効なら変えない", () => {
    const session = henshuSession({ selectedIndex: 9 });
    expect(setYakubun(session, "x")).toEqual(session);
  });
});

describe("mergeSelected / resplitSelected", () => {
  test("選択中と次を結合する", () => {
    const next = mergeSelected(henshuSession({ selectedIndex: 0 }));
    expect(next.buns.map((bun) => bun.body)).toEqual(["あ。い。", "う。"]);
    expect(next.selectedIndex).toBe(0);
  });

  test("末尾では結合しない", () => {
    const session = henshuSession({ selectedIndex: 2 });
    expect(mergeSelected(session).buns).toEqual(session.buns);
  });

  test("キャレット位置で再分割する", () => {
    const session = henshuSession({
      buns: [
        {
          body: "あいう",
          yakubun: "x",
          tekisetsu: true,
          imi: true,
          bunpo: true,
          shiteki: null,
          hinto: null,
        },
      ],
      selectedIndex: 0,
    });
    const next = resplitSelected(session, 1);
    expect(next.buns.map((bun) => bun.body)).toEqual(["あ", "いう"]);
    expect(next.buns.every((bun) => bun.yakubun === "")).toBe(true);
    expect(next.buns.every((bun) => bun.tekisetsu === null)).toBe(true);
  });

  test("キャレット先頭では再分割しない", () => {
    const session = henshuSession({ selectedIndex: 0 });
    expect(resplitSelected(session, 0).buns).toEqual(session.buns);
  });
});
