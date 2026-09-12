import { describe, expect, test, vi } from "vitest";
import { runHanteiIfNeeded, type Hantei } from "./hantei";

function raw(partial: Partial<Hantei> & Pick<Hantei, "imi" | "bunpo">): Hantei {
  return {
    tekisetsu: partial.tekisetsu ?? false,
    imi: partial.imi,
    bunpo: partial.bunpo,
    shiteki: partial.shiteki ?? null,
    naoshitaYakubun: partial.naoshitaYakubun ?? null,
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
      naoshitaYakubun: null,
    });
    expect(run).toHaveBeenCalledOnce();
  });

  test("tekisetsu が imi && bunpo とずれたら補正する", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: true,
          imi: true,
          bunpo: false,
          shiteki: "指摘",
          naoshitaYakubun: "I went.",
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: true,
      bunpo: false,
      shiteki: "指摘",
      naoshitaYakubun: "I went.",
    });

    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: false,
          imi: true,
          bunpo: true,
          shiteki: "指摘",
          naoshitaYakubun: "I went.",
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "指摘",
      naoshitaYakubun: "I went.",
    });
  });

  test("不適切なら直した訳文を残す", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: false,
          imi: false,
          bunpo: true,
          shiteki: "動詞がありません",
          naoshitaYakubun: "I went to school.",
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: true,
      shiteki: "動詞がありません",
      naoshitaYakubun: "I went to school.",
    });
  });

  test("適切でも空でなければ naoshitaYakubun を残す", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: true,
          imi: true,
          bunpo: true,
          shiteki: "もう少し自然に",
          naoshitaYakubun: "I went.",
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "もう少し自然に",
      naoshitaYakubun: "I went.",
    });
  });

  test("適切で十分自然なら naoshitaYakubun は null", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: true,
          imi: true,
          bunpo: true,
          shiteki: "このままで自然",
          naoshitaYakubun: null,
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "このままで自然",
      naoshitaYakubun: null,
    });
  });

  test("境界: 適切で naoshitaYakubun が空なら null", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({
          tekisetsu: true,
          imi: true,
          bunpo: true,
          shiteki: "このままで自然",
          naoshitaYakubun: "",
        }),
      ),
    ).resolves.toEqual({
      tekisetsu: true,
      imi: true,
      bunpo: true,
      shiteki: "このままで自然",
      naoshitaYakubun: null,
    });
  });

  test("境界: 不適切で直した訳文が空なら null", async () => {
    await expect(
      runHanteiIfNeeded("Hi", async () =>
        raw({ tekisetsu: true, imi: false, bunpo: false, shiteki: "指摘", naoshitaYakubun: "" }),
      ),
    ).resolves.toEqual({
      tekisetsu: false,
      imi: false,
      bunpo: false,
      shiteki: "指摘",
      naoshitaYakubun: null,
    });
  });
});
