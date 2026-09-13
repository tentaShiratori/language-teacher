import { beforeEach, describe, expect, test, vi } from "vitest";
import { HANTEI_LOG_PATH } from "./appRoutes";
import { openHanteiLogMado } from "./openHanteiLogMado";

const HANTEI_LOG_MADO_LABEL = "hantei-log";
const HANTEI_LOG_MADO_URL = `/#${HANTEI_LOG_PATH}`;

const { constructed, getByLabel, isDebug, setFocus, once } = vi.hoisted(() => {
  const constructed: Array<{
    label: string;
    options: { url: string; title: string; width: number; height: number };
  }> = [];
  return {
    constructed,
    getByLabel: vi.fn<(label: string) => Promise<{ setFocus: () => Promise<void> } | null>>(),
    isDebug: vi.fn<() => Promise<boolean>>(),
    setFocus: vi.fn<() => Promise<void>>(),
    once: vi.fn<(event: string, handler: (event?: { payload: string }) => void) => void>(),
  };
});

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: class {
    static getByLabel = getByLabel;
    once = once;
    constructor(
      public label: string,
      public options: { url: string; title: string; width: number; height: number },
    ) {
      constructed.push({ label, options });
    }
  },
}));

vi.mock("./debug", () => ({
  isDebug: () => isDebug(),
}));

describe("openHanteiLogMado", () => {
  beforeEach(() => {
    getByLabel.mockReset();
    isDebug.mockReset();
    setFocus.mockReset();
    once.mockReset();
    constructed.length = 0;
    isDebug.mockResolvedValue(true);
  });

  test("debug なら既存ウィンドウがあれば前面に出す", async () => {
    getByLabel.mockResolvedValue({ setFocus });
    setFocus.mockResolvedValue(undefined);

    await openHanteiLogMado();

    expect(isDebug).toHaveBeenCalledTimes(1);
    expect(getByLabel).toHaveBeenCalledWith(HANTEI_LOG_MADO_LABEL);
    expect(setFocus).toHaveBeenCalledTimes(1);
    expect(constructed).toHaveLength(0);
  });

  test("debug なら無ければ第2ウィンドウを作る", async () => {
    getByLabel.mockResolvedValue(null);
    once.mockImplementation((event, handler) => {
      if (event === "tauri://created") {
        handler();
      }
    });

    await openHanteiLogMado();

    expect(constructed).toEqual([
      {
        label: HANTEI_LOG_MADO_LABEL,
        options: {
          url: HANTEI_LOG_MADO_URL,
          title: "判定ログ",
          width: 720,
          height: 640,
        },
      },
    ]);
  });

  test("作成失敗なら拒否する", async () => {
    getByLabel.mockResolvedValue(null);
    once.mockImplementation((event, handler) => {
      if (event === "tauri://error") {
        handler({ payload: "denied" });
      }
    });

    await expect(openHanteiLogMado()).rejects.toThrow("denied");
  });

  test("本番なら窓を作らず既存も前面に出さない", async () => {
    isDebug.mockResolvedValue(false);
    getByLabel.mockResolvedValue({ setFocus });
    setFocus.mockResolvedValue(undefined);

    await openHanteiLogMado();

    expect(isDebug).toHaveBeenCalledTimes(1);
    expect(getByLabel).not.toHaveBeenCalled();
    expect(setFocus).not.toHaveBeenCalled();
    expect(constructed).toHaveLength(0);
  });

  test("isDebug 失敗なら拒否し、窓を作らない", async () => {
    isDebug.mockRejectedValue(new Error("unavailable"));
    getByLabel.mockResolvedValue(null);

    await expect(openHanteiLogMado()).rejects.toThrow("unavailable");
    expect(getByLabel).not.toHaveBeenCalled();
    expect(constructed).toHaveLength(0);
  });
});
