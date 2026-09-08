import { describe, expect, test, vi } from "vitest";
import { runHanteiIfNeeded, type Hantei } from "./hantei";
import type { Kasho } from "./kasho";

function raw(partial: Partial<Hantei> & Pick<Hantei, "imi" | "bunpo">): Hantei {
  return {
    tekisetsu: partial.tekisetsu ?? false,
    imi: partial.imi,
    bunpo: partial.bunpo,
    shiteki: partial.shiteki ?? null,
    hinto: partial.hinto ?? null,
    kasho: partial.kasho ?? [],
  };
}

describe("runHanteiIfNeeded", () => {
  test("空訳文は呼ばない", async () => {
    const run = vi.fn<() => Promise<Hantei>>(async () =>
      raw({ tekisetsu: true, imi: true, bunpo: true }),
    );
    await expect(runHanteiIfNeeded("", run)).resolves.toBeNull();
    expect(run).not.toHaveBeenCalled();
  });

  test("非空は run する", async () => {
    const run = vi.fn<() => Promise<Hantei>>(async () =>
      raw({ tekisetsu: true, imi: true, bunpo: true }),
    );
    await expect(runHanteiIfNeeded("Hello", run)).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: null,
      hinto: null,
      kasho: [],
    });
    expect(run).toHaveBeenCalledOnce();
  });

  test("tekisetsu が imi && bunpo とずれたら補正する", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({ tekisetsu: true, imi: true, bunpo: false, shiteki: "指摘", hinto: "ヒント" }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: true,
      bunpo: false,
      shiteki: null,
      hinto: "ヒント",
      kasho: [],
    });

    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({ tekisetsu: false, imi: true, bunpo: true, shiteki: "指摘", hinto: "ヒント" }),
      ),
    ).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "指摘",
      hinto: null,
      kasho: [],
    });
  });

  test("不適切なら shiteki を捨てる", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: false,
          imi: false,
          bunpo: true,
          shiteki: "指摘は捨てる",
          hinto: "動詞がありません",
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: true,
      shiteki: null,
      hinto: "動詞がありません",
      kasho: [],
    });
  });

  test("適切なら hinto と kasho を捨てる", async () => {
    const kasho: Kasho[] = [{ shurui: "ketsujo", index: 0 }];
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: true,
          imi: true,
          bunpo: true,
          shiteki: "もう少し自然に",
          hinto: "ヒントは捨てる",
          kasho,
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "もう少し自然に",
      hinto: null,
      kasho: [],
    });
  });

  test("不適切なら訳文内の箇所を残す", async () => {
    const kasho: Kasho[] = [
      { shurui: "ketsujo", index: 2 },
      { shurui: "ayamari", start: 0, end: 2 },
    ];
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: false,
          imi: true,
          bunpo: false,
          hinto: "動詞がありません",
          kasho,
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: true,
      bunpo: false,
      shiteki: null,
      hinto: "動詞がありません",
      kasho,
    });
  });

  test("範囲外の箇所は捨てる", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: false,
          imi: false,
          bunpo: false,
          hinto: "違う",
          kasho: [{ shurui: "ketsujo", index: 99 }],
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: false,
      shiteki: null,
      hinto: "違う",
      kasho: [],
    });
  });

  test("境界: imi も bunpo も false", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({ tekisetsu: true, imi: false, bunpo: false, shiteki: "指摘", hinto: null }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: false,
      shiteki: null,
      hinto: null,
      kasho: [],
    });
  });
});
