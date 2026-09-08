import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { OllamaStatus, Settings } from "../../lib/ollama";
import * as store from "../../lib/store";
import { useOllama } from "./useOllama";

vi.mock("../../lib/store", () => ({
  fetchOllamaStatus: vi.fn<() => Promise<OllamaStatus>>(),
  loadSettings: vi.fn<() => Promise<Settings>>(),
  saveSettings: vi.fn<(settings: Settings) => Promise<OllamaStatus>>(),
  logJsError: vi.fn<() => Promise<void>>(async () => undefined),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useOllama", () => {
  test("起動時に設定と状態を取る", async () => {
    vi.mocked(store.loadSettings).mockResolvedValue({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
    vi.mocked(store.fetchOllamaStatus).mockResolvedValue({ kind: "ok" });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(true);
    expect(result.current.status).toEqual({ kind: "ok" });
    expect(result.current.settings.ollamaModel).toBe("qwen3:8b");
  });

  test("届かないときは判定できない", async () => {
    vi.mocked(store.loadSettings).mockResolvedValue({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
    vi.mocked(store.fetchOllamaStatus).mockResolvedValue({ kind: "unreachable" });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(false);
    expect(result.current.status).toEqual({ kind: "unreachable" });
  });

  test("モデル無しを区別する", async () => {
    vi.mocked(store.loadSettings).mockResolvedValue({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
    vi.mocked(store.fetchOllamaStatus).mockResolvedValue({
      kind: "modelMissing",
      model: "qwen3:8b",
    });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(false);
    expect(result.current.status).toEqual({ kind: "modelMissing", model: "qwen3:8b" });
  });

  test("設定保存後に再検知する", async () => {
    vi.mocked(store.loadSettings).mockResolvedValue({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
    vi.mocked(store.fetchOllamaStatus).mockResolvedValue({
      kind: "modelMissing",
      model: "qwen3:8b",
    });
    vi.mocked(store.saveSettings).mockResolvedValue({ kind: "ok" });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.onSaveSettings({
        ollamaBaseUrl: "http://127.0.0.1:11434",
        ollamaModel: "qwen3:14b",
      });
    });

    expect(store.saveSettings).toHaveBeenCalledWith({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:14b",
    });
    expect(result.current.canHantei).toBe(true);
    expect(result.current.settings.ollamaModel).toBe("qwen3:14b");
  });

  test("invoke 失敗は届かない扱い", async () => {
    vi.mocked(store.loadSettings).mockRejectedValue(new Error("ipc"));
    vi.mocked(store.fetchOllamaStatus).mockRejectedValue(new Error("ipc"));

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(false);
    expect(result.current.status).toEqual({ kind: "unreachable" });
  });

  test("設定読込だけ失敗しても検知結果は残す", async () => {
    vi.mocked(store.loadSettings).mockRejectedValue(new Error("ipc"));
    vi.mocked(store.fetchOllamaStatus).mockResolvedValue({ kind: "ok" });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(true);
    expect(result.current.status).toEqual({ kind: "ok" });
    expect(result.current.settings).toEqual({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
  });
});
