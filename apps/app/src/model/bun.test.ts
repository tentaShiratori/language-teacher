import { describe, expect, test } from "vitest";
import { mergeBun, resplitBun, splitBun, type Bun } from "./bun";

function bun(body: string, overrides: Partial<Omit<Bun, "body">> = {}): Bun {
  return {
    body,
    yakubun: overrides.yakubun ?? "",
    tekisetsu: overrides.tekisetsu ?? null,
    imi: overrides.imi ?? null,
    bunpo: overrides.bunpo ?? null,
    shiteki: overrides.shiteki ?? null,
  };
}

describe("splitBun", () => {
  test("通常の句点で分割する", () => {
    expect(splitBun("こんにちは。さようなら。")).toEqual(["こんにちは。", "さようなら。"]);
  });

  test("！と？と全角ピリオドでも分割する", () => {
    expect(splitBun("すごい！本当？です．")).toEqual(["すごい！", "本当？", "です．"]);
  });

  test("末尾に句点がなくても最後の断片を残す", () => {
    expect(splitBun("こんにちは。さようなら")).toEqual(["こんにちは。", "さようなら"]);
  });

  test("連続改行の空断片を捨てる", () => {
    expect(splitBun("あ\n\nい")).toEqual(["あ", "い"]);
  });

  test("改行だけでも分割する", () => {
    expect(splitBun("一行目\n二行目")).toEqual(["一行目", "二行目"]);
  });

  test("鉤括弧内の句点でも分割する", () => {
    expect(splitBun("「あ。い。」う。")).toEqual(["「あ。", "い。", "」う。"]);
  });

  test("空文字は空配列", () => {
    expect(splitBun("")).toEqual([]);
  });

  test("句点だけの文字列は一つの文", () => {
    expect(splitBun("。")).toEqual(["。"]);
  });

  test("改行のみは空配列", () => {
    expect(splitBun("\n\n")).toEqual([]);
  });

  test("半角ピリオドでは分割しない", () => {
    expect(splitBun("3.14である。次。")).toEqual(["3.14である。", "次。"]);
  });
});

describe("mergeBun", () => {
  test("隣り合う文を結合し判定を捨てる", () => {
    const input = [
      bun("あ。", {
        yakubun: "A",
        tekisetsu: true,
        imi: true,
        bunpo: true,
        shiteki: "直すとよい",
      }),
      bun("い。", {
        yakubun: "B",
        tekisetsu: false,
        imi: false,
        bunpo: true,
        shiteki: "動詞を",
      }),
      bun("う。"),
    ];

    expect(mergeBun(input, 0)).toEqual([bun("あ。い。", { yakubun: "AB" }), bun("う。")]);
  });

  test("末尾では結合しない", () => {
    const input = [bun("あ。"), bun("い。")];
    expect(mergeBun(input, 1)).toEqual(input);
  });

  test("負の index では結合しない", () => {
    const input = [bun("あ。"), bun("い。")];
    expect(mergeBun(input, -1)).toEqual(input);
  });

  test("文が一つのときは結合しない", () => {
    const input = [bun("あ。", { tekisetsu: true })];
    expect(mergeBun(input, 0)).toEqual(input);
  });
});

describe("resplitBun", () => {
  test("キャレット位置で再分割し判定を捨てる", () => {
    const input = [
      bun("あいうえお", {
        yakubun: "abc",
        tekisetsu: true,
        imi: true,
        bunpo: true,
        shiteki: "tone",
      }),
      bun("か。"),
    ];

    expect(resplitBun(input, 0, 2)).toEqual([bun("あい"), bun("うえお"), bun("か。")]);
  });

  test("キャレットが先頭なら再分割しない", () => {
    const input = [bun("あい", { tekisetsu: true })];
    expect(resplitBun(input, 0, 0)).toEqual(input);
  });

  test("キャレットが末尾なら再分割しない", () => {
    const input = [bun("あい", { tekisetsu: true })];
    expect(resplitBun(input, 0, 2)).toEqual(input);
  });

  test("範囲外の index では再分割しない", () => {
    const input = [bun("あい")];
    expect(resplitBun(input, 1, 1)).toEqual(input);
    expect(resplitBun(input, -1, 1)).toEqual(input);
  });
});
