import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useOllama } from "./useOllama";

const fetchOllamaStatus = vi.fn();
const loadSettings = vi.fn();
const saveSettings = vi.fn();

vi.mock("./store", () => ({
  fetchOllamaStatus: (...args: unknown[]) => fetchOllamaStatus(...args),
  loadSettings: (...args: unknown[]) => loadSettings(...args),
  saveSettings: (...args: unknown[]) => saveSettings(...args),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useOllama", () => {
  test("起動時に設定と状態を取る", async () => {
    loadSettings.mockResolvedValue({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
    fetchOllamaStatus.mockResolvedValue({ kind: "ok" });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(true);
    expect(result.current.status).toEqual({ kind: "ok" });
    expect(result.current.settings.ollamaModel).toBe("qwen3:8b");
  });

  test("届かないときは判定できない", async () => {
    loadSettings.mockResolvedValue({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
    fetchOllamaStatus.mockResolvedValue({ kind: "unreachable" });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(false);
    expect(result.current.status).toEqual({ kind: "unreachable" });
  });

  test("モデル無しを区別する", async () => {
    loadSettings.mockResolvedValue({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
    fetchOllamaStatus.mockResolvedValue({ kind: "modelMissing", model: "qwen3:8b" });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(false);
    expect(result.current.status).toEqual({ kind: "modelMissing", model: "qwen3:8b" });
  });

  test("設定保存後に再検知する", async () => {
    loadSettings.mockResolvedValue({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
    fetchOllamaStatus.mockResolvedValue({ kind: "modelMissing", model: "qwen3:8b" });
    saveSettings.mockResolvedValue({ kind: "ok" });

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.onSaveSettings({
        ollamaBaseUrl: "http://127.0.0.1:11434",
        ollamaModel: "qwen3:14b",
      });
    });

    expect(saveSettings).toHaveBeenCalledWith({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:14b",
    });
    expect(result.current.canHantei).toBe(true);
    expect(result.current.settings.ollamaModel).toBe("qwen3:14b");
  });

  test("invoke 失敗は届かない扱い", async () => {
    loadSettings.mockRejectedValue(new Error("ipc"));
    fetchOllamaStatus.mockRejectedValue(new Error("ipc"));

    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.canHantei).toBe(false);
    expect(result.current.status).toEqual({ kind: "unreachable" });
  });
});
