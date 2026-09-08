import { describe, expect, test, vi } from "vitest";
import { normalizeHantei, runHanteiIfNeeded, shouldCallHantei, type Hantei } from "./hantei";

describe("shouldCallHantei", () => {
  test("空訳文は呼ばない", () => {
    expect(shouldCallHantei("")).toBe(false);
  });

  test("非空は呼ぶ", () => {
    expect(shouldCallHantei("Hello")).toBe(true);
  });
});

describe("runHanteiIfNeeded", () => {
  test("空訳文は run を呼ばない", async () => {
    const run = vi.fn<() => Promise<Hantei>>(async () => ({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: null,
      hinto: null,
    }));
    await expect(runHanteiIfNeeded("", run)).resolves.toBeNull();
    expect(run).not.toHaveBeenCalled();
  });

  test("非空は run して補正する", async () => {
    const run = vi.fn<() => Promise<Hantei>>(async () => ({
      tekisetsu: true,
      imi: true,
      bunpo: false,
      shiteki: "指摘",
      hinto: "ヒント",
    }));
    await expect(runHanteiIfNeeded("Hi", run)).resolves.toEqual({
      tekisetsu: false,
      imi: true,
      bunpo: false,
      shiteki: null,
      hinto: "ヒント",
    });
    expect(run).toHaveBeenCalledOnce();
  });
});

describe("normalizeHantei", () => {
  test("tekisetsu が imi && bunpo とずれたら補正する", () => {
    expect(
      normalizeHantei({
        tekisetsu: true,
        imi: true,
        bunpo: false,
        shiteki: "指摘",
        hinto: "ヒント",
      }),
    ).toEqual({
      tekisetsu: false,
      imi: true,
      bunpo: false,
      shiteki: null,
      hinto: "ヒント",
    });

    expect(
      normalizeHantei({
        tekisetsu: false,
        imi: true,
        bunpo: true,
        shiteki: "指摘",
        hinto: "ヒント",
      }),
    ).toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "指摘",
      hinto: null,
    });
  });

  test("不適切なら shiteki を捨てる", () => {
    expect(
      normalizeHantei({
        tekisetsu: false,
        imi: false,
        bunpo: true,
        shiteki: "指摘は捨てる",
        hinto: "動詞がありません",
      }),
    ).toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: true,
      shiteki: null,
      hinto: "動詞がありません",
    });
  });

  test("適切なら hinto を捨てる", () => {
    expect(
      normalizeHantei({
        tekisetsu: true,
        imi: true,
        bunpo: true,
        shiteki: "もう少し自然に",
        hinto: "ヒントは捨てる",
      }),
    ).toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "もう少し自然に",
      hinto: null,
    });
  });

  test("境界: imi も bunpo も false", () => {
    expect(
      normalizeHantei({
        tekisetsu: true,
        imi: false,
        bunpo: false,
        shiteki: "指摘",
        hinto: null,
      }),
    ).toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: false,
      shiteki: null,
      hinto: null,
    });
  });
});
