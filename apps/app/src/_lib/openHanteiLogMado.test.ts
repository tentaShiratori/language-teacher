import { beforeEach, describe, expect, test, vi } from "vitest";
import { HANTEI_LOG_PATH } from "./appRoutes";
import { openHanteiLogMado } from "./openHanteiLogMado";

const HANTEI_LOG_MADO_LABEL = "hantei-log";
const HANTEI_LOG_MADO_URL = `/#${HANTEI_LOG_PATH}`;

const getByLabel = vi.fn<() => Promise<{ setFocus: () => Promise<void> } | null>>();
const setFocus = vi.fn<() => Promise<void>>();
const once = vi.fn<(event: string, handler: (...args: never[]) => void) => void>();

vi.mock("@tauri-apps/api/webviewWindow", () => {
  class WebviewWindow {
    static getByLabel = (...args: unknown[]) => getByLabel(...args);
    once = (...args: unknown[]) => once(...args);
    constructor(
      public label: string,
      public options: { url: string; title: string; width: number; height: number },
    ) {
      constructed.push({ label, options });
    }
  }
  return { WebviewWindow };
});

const constructed: Array<{
  label: string;
  options: { url: string; title: string; width: number; height: number };
}> = [];

describe("openHanteiLogMado", () => {
  beforeEach(() => {
    getByLabel.mockReset();
    setFocus.mockReset();
    once.mockReset();
    constructed.length = 0;
  });

  test("既存ウィンドウがあれば前面に出す", async () => {
    getByLabel.mockResolvedValue({ setFocus });
    setFocus.mockResolvedValue(undefined);

    await openHanteiLogMado();

    expect(getByLabel).toHaveBeenCalledWith(HANTEI_LOG_MADO_LABEL);
    expect(setFocus).toHaveBeenCalledTimes(1);
    expect(constructed).toHaveLength(0);
  });

  test("無ければ第2ウィンドウを作る", async () => {
    getByLabel.mockResolvedValue(null);
    once.mockImplementation((event: string, handler: () => void) => {
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
    once.mockImplementation((event: string, handler: (event: { payload: string }) => void) => {
      if (event === "tauri://error") {
        handler({ payload: "denied" });
      }
    });

    await expect(openHanteiLogMado()).rejects.toThrow("denied");
  });
});
