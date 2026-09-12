import { describe, expect, test, vi } from "vitest";
import { runHanteiIfNeeded, type Hantei } from "./hantei";

function raw(partial: Partial<Hantei> & Pick<Hantei, "imi" | "bunpo">): Hantei {
  return {
    tekisetsu: partial.tekisetsu ?? false,
    imi: partial.imi,
    bunpo: partial.bunpo,
    shiteki: partial.shiteki ?? null,
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
    });
    expect(run).toHaveBeenCalledOnce();
  });

  test("tekisetsu が imi && bunpo とずれたら補正する", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({ tekisetsu: true, imi: true, bunpo: false, shiteki: "指摘" }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: true,
      bunpo: false,
      shiteki: "指摘",
    });

    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({ tekisetsu: false, imi: true, bunpo: true, shiteki: "指摘" }),
      ),
    ).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "指摘",
    });
  });

  test("不適切でも shiteki を残す", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: false,
          imi: false,
          bunpo: true,
          shiteki: "動詞が無く、I went to school. が自然です",
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: true,
      shiteki: "動詞が無く、I went to school. が自然です",
    });
  });

  test("適切なら短い指摘を残す", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: true,
          imi: true,
          bunpo: true,
          shiteki: "このままで自然",
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "このままで自然",
    });
  });

  test("境界: imi も bunpo も false でも shiteki を残す", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({ tekisetsu: true, imi: false, bunpo: false, shiteki: "指摘" }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: false,
      shiteki: "指摘",
    });
  });
});
