import { describe, expect, test } from "vitest";
import { buildKashoSegments, normalizeKasho, type Kasho } from "./kasho";

describe("normalizeKasho", () => {
  const yakubun = "I go school";

  test("適切なら空にする", () => {
    expect(normalizeKasho(yakubun, [{ shurui: "ayamari", start: 0, end: 1 }], true)).toEqual([]);
  });

  test("null / undefined は空", () => {
    expect(normalizeKasho(yakubun, null, false)).toEqual([]);
    expect(normalizeKasho(yakubun, undefined, false)).toEqual([]);
  });

  test("正常な誤りを残す", () => {
    const input: Kasho[] = [{ shurui: "ayamari", start: 0, end: 1 }];
    expect(normalizeKasho(yakubun, input, false)).toEqual(input);
  });

  test("ayamari 以外は捨てる", () => {
    expect(
      normalizeKasho(
        yakubun,
        [{ shurui: "ketsujo", index: 5 } as never, { shurui: "ayamari", start: 0, end: 1 }],
        false,
      ),
    ).toEqual([{ shurui: "ayamari", start: 0, end: 1 }]);
  });

  test("範囲外・逆転・ゼロ長を捨てる", () => {
    expect(
      normalizeKasho(
        yakubun,
        [
          { shurui: "ayamari", start: 3, end: 3 },
          { shurui: "ayamari", start: 4, end: 2 },
          { shurui: "ayamari", start: -1, end: 2 },
          { shurui: "ayamari", start: 0, end: 100 },
        ],
        false,
      ),
    ).toEqual([]);
  });

  test("境界: 全文を誤りにする", () => {
    const len = [...yakubun].length;
    expect(normalizeKasho(yakubun, [{ shurui: "ayamari", start: 0, end: len }], false)).toEqual([
      { shurui: "ayamari", start: 0, end: len },
    ]);
  });

  test("日本語の文字数で範囲を見る", () => {
    expect(normalizeKasho("こんにちは", [{ shurui: "ayamari", start: 0, end: 5 }], false)).toEqual([
      { shurui: "ayamari", start: 0, end: 5 },
    ]);
    expect(normalizeKasho("こんにちは", [{ shurui: "ayamari", start: 0, end: 6 }], false)).toEqual(
      [],
    );
  });
});

describe("buildKashoSegments", () => {
  test("誤りの範囲を連続断片にする", () => {
    expect(buildKashoSegments("abcd", [{ shurui: "ayamari", start: 1, end: 3 }])).toEqual([
      { text: "a", ayamari: false },
      { text: "bc", ayamari: true },
      { text: "d", ayamari: false },
    ]);
  });

  test("隣接する誤りは一つの断片にまとめる", () => {
    expect(
      buildKashoSegments("abcd", [
        { shurui: "ayamari", start: 1, end: 2 },
        { shurui: "ayamari", start: 2, end: 3 },
      ]),
    ).toEqual([
      { text: "a", ayamari: false },
      { text: "bc", ayamari: true },
      { text: "d", ayamari: false },
    ]);
  });

  test("空訳文は空配列", () => {
    expect(buildKashoSegments("", [])).toEqual([]);
  });

  test("箇所なしは全文一つの断片", () => {
    expect(buildKashoSegments("ab", [])).toEqual([{ text: "ab", ayamari: false }]);
  });
});
