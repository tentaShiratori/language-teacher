import { describe, expect, test } from "vitest";
import { buildKashoCols, normalizeKasho, type Kasho } from "./kasho";

describe("normalizeKasho", () => {
  const yakubun = "I go school";

  test("適切なら空にする", () => {
    expect(normalizeKasho(yakubun, [{ shurui: "ketsujo", index: 5 }], true)).toEqual([]);
  });

  test("null / undefined は空", () => {
    expect(normalizeKasho(yakubun, null, false)).toEqual([]);
    expect(normalizeKasho(yakubun, undefined, false)).toEqual([]);
  });

  test("正常な欠けと誤りを残す", () => {
    const input: Kasho[] = [
      { shurui: "ketsujo", index: 5 },
      { shurui: "ayamari", start: 0, end: 1 },
    ];
    expect(normalizeKasho(yakubun, input, false)).toEqual(input);
  });

  test("範囲外の欠けを捨てる", () => {
    expect(normalizeKasho(yakubun, [{ shurui: "ketsujo", index: 100 }], false)).toEqual([]);
  });

  test("末尾の欠けは許す", () => {
    const len = [...yakubun].length;
    expect(normalizeKasho(yakubun, [{ shurui: "ketsujo", index: len }], false)).toEqual([
      { shurui: "ketsujo", index: len },
    ]);
  });

  test("逆転・ゼロ長の誤りを捨てる", () => {
    expect(
      normalizeKasho(
        yakubun,
        [
          { shurui: "ayamari", start: 3, end: 3 },
          { shurui: "ayamari", start: 4, end: 2 },
          { shurui: "ayamari", start: -1, end: 2 },
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
    expect(normalizeKasho("こんにちは", [{ shurui: "ketsujo", index: 5 }], false)).toEqual([
      { shurui: "ketsujo", index: 5 },
    ]);
    expect(normalizeKasho("こんにちは", [{ shurui: "ketsujo", index: 6 }], false)).toEqual([]);
  });

  test("空訳文は index 0 の欠けだけ許す", () => {
    expect(normalizeKasho("", [{ shurui: "ketsujo", index: 0 }], false)).toEqual([
      { shurui: "ketsujo", index: 0 },
    ]);
    expect(normalizeKasho("", [{ shurui: "ketsujo", index: 1 }], false)).toEqual([]);
  });
});

describe("buildKashoCols", () => {
  test("欠けの列を文字の間に挟む", () => {
    expect(buildKashoCols("ab", [{ shurui: "ketsujo", index: 1 }])).toEqual([
      { shurui: "moji", moji: "a", ayamari: false },
      { shurui: "ketsujo" },
      { shurui: "moji", moji: "b", ayamari: false },
    ]);
  });

  test("誤りの範囲に ayamari を付ける", () => {
    expect(buildKashoCols("abcd", [{ shurui: "ayamari", start: 1, end: 3 }])).toEqual([
      { shurui: "moji", moji: "a", ayamari: false },
      { shurui: "moji", moji: "b", ayamari: true },
      { shurui: "moji", moji: "c", ayamari: true },
      { shurui: "moji", moji: "d", ayamari: false },
    ]);
  });

  test("先頭と末尾の欠け", () => {
    expect(
      buildKashoCols("a", [
        { shurui: "ketsujo", index: 0 },
        { shurui: "ketsujo", index: 1 },
      ]),
    ).toEqual([
      { shurui: "ketsujo" },
      { shurui: "moji", moji: "a", ayamari: false },
      { shurui: "ketsujo" },
    ]);
  });

  test("空訳文で末尾欠けだけ", () => {
    expect(buildKashoCols("", [{ shurui: "ketsujo", index: 0 }])).toEqual([{ shurui: "ketsujo" }]);
  });
});
