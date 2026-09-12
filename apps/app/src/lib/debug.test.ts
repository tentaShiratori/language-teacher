import { beforeEach, describe, expect, test, vi } from "vitest";
import { applyDebugDataset, isDebug } from "./debug";

const invoke = vi.fn<(cmd: string) => Promise<boolean>>();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (cmd: string) => invoke(cmd),
}));

describe("isDebug", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  test("コマンドが true なら開発用", async () => {
    invoke.mockResolvedValue(true);
    await expect(isDebug()).resolves.toBe(true);
    expect(invoke).toHaveBeenCalledWith("is_debug");
  });

  test("コマンドが false なら本番", async () => {
    invoke.mockResolvedValue(false);
    await expect(isDebug()).resolves.toBe(false);
  });

  test("コマンド失敗は拒否する", async () => {
    invoke.mockRejectedValue(new Error("unavailable"));
    await expect(isDebug()).rejects.toThrow("unavailable");
  });
});

describe("applyDebugDataset", () => {
  test("true なら data-debug を付ける", () => {
    const el = document.createElement("html");
    applyDebugDataset(el, true);
    expect(el.dataset.debug).toBe("");
    expect(el.hasAttribute("data-debug")).toBe(true);
  });

  test("false なら data-debug を外す", () => {
    const el = document.createElement("html");
    el.dataset.debug = "";
    applyDebugDataset(el, false);
    expect(el.dataset.debug).toBeUndefined();
    expect(el.hasAttribute("data-debug")).toBe(false);
  });

  test("false の初期状態は何も付けない", () => {
    const el = document.createElement("html");
    applyDebugDataset(el, false);
    expect(el.hasAttribute("data-debug")).toBe(false);
  });
});
