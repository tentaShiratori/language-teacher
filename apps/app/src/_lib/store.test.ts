import { describe, expect, test } from "vitest";
import { fromRecord, startGenbun, toRecord, type GenbunSession } from "./genbun";
import { isGakushuGengo, type GenbunRecord } from "./store";

function savedSession(): GenbunSession {
  return {
    id: "session-1",
    body: "あ。い。",
    gakushuGengo: "en",
    createdAt: "2026-09-08T00:00:00.000Z",
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
    ],
    selectedIndex: 0,
  };
}

describe("isGakushuGengo", () => {
  test("定義どおり受け付ける", () => {
    expect(isGakushuGengo("en")).toBe(true);
    expect(isGakushuGengo("zh_hans")).toBe(true);
    expect(isGakushuGengo("ko")).toBe(true);
    expect(isGakushuGengo("de")).toBe(true);
  });

  test("未知は拒否", () => {
    expect(isGakushuGengo("ja")).toBe(false);
    expect(isGakushuGengo("")).toBe(false);
  });
});

describe("toRecord / fromRecord", () => {
  test("保存可能なセッションをレコードにする", () => {
    const record = toRecord(savedSession());
    expect(record?.id).toBe("session-1");
    expect(record?.buns[0]?.yakubun).toBe("");
  });

  test("未確定は保存しない", () => {
    expect(toRecord(startGenbun("あ。")!)).toBeNull();
    expect(toRecord({ ...savedSession(), id: null })).toBeNull();
    expect(toRecord({ ...savedSession(), createdAt: null })).toBeNull();
  });

  test("レコードからセッションへ戻す", () => {
    const record: GenbunRecord = {
      id: "r1",
      body: "あ。",
      gakushuGengo: "de",
      createdAt: "2026-01-01T00:00:00.000Z",
      buns: [
        {
          body: "あ。",
          yakubun: "Ah.",
          tekisetsu: null,
          imi: null,
          bunpo: null,
          shiteki: null,
          hinto: null,
        },
      ],
    };
    expect(fromRecord(record)?.gakushuGengo).toBe("de");
    expect(fromRecord(record)?.selectedIndex).toBe(0);
  });

  test("未知の学習言語は拒否する", () => {
    expect(fromRecord({ ...savedSession(), gakushuGengo: "fr" } as never)).toBeNull();
  });
});
