import { createElement, StrictMode, type ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { GenbunRecord } from "../../lib/store";
import * as store from "../../lib/store";
import { useGenbun } from "./useGenbun";

vi.mock("../../lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/store")>();
  return {
    ...actual,
    deleteGenbun: vi.fn<() => Promise<void>>(async () => undefined),
    listGenbun: vi.fn<() => Promise<store.GenbunSummary[]>>(),
    loadGenbun: vi.fn<() => Promise<GenbunRecord | null>>(),
    saveGenbun: vi.fn<(record: GenbunRecord) => Promise<void>>(),
    logJsError: vi.fn<() => Promise<void>>(async () => undefined),
  };
});

function StrictWrapper({ children }: { children: ReactNode }) {
  return createElement(StrictMode, null, children);
}

function savedIds(): string[] {
  return vi.mocked(store.saveGenbun).mock.calls.map((call) => call[0].id);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useGenbun", () => {
  test("Strict Mode でも学習言語を選ぶと原文は1件だけ保存する", async () => {
    vi.mocked(store.listGenbun).mockResolvedValue([]);
    vi.mocked(store.saveGenbun).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGenbun(), { wrapper: StrictWrapper });
    await waitFor(() => expect(store.listGenbun).toHaveBeenCalled());

    act(() => {
      result.current.onPaste("あ。い。");
    });
    act(() => {
      result.current.onSelectGengo("en");
    });

    await waitFor(() => expect(store.saveGenbun).toHaveBeenCalled());
    expect(savedIds()).toHaveLength(1);
    expect(new Set(savedIds()).size).toBe(1);
    expect(result.current.session?.gakushuGengo).toBe("en");
    expect(result.current.session?.id).toBe(savedIds()[0]);
  });

  test("原文が無いとき学習言語を選んでも保存しない", async () => {
    vi.mocked(store.listGenbun).mockResolvedValue([]);
    vi.mocked(store.saveGenbun).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGenbun());
    await waitFor(() => expect(store.listGenbun).toHaveBeenCalled());

    act(() => {
      result.current.onSelectGengo("en");
    });

    expect(store.saveGenbun).not.toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  test("保存に失敗してもセッションは残る", async () => {
    vi.mocked(store.listGenbun).mockResolvedValue([]);
    vi.mocked(store.saveGenbun).mockRejectedValue(new Error("disk"));

    const { result } = renderHook(() => useGenbun());
    await waitFor(() => expect(store.listGenbun).toHaveBeenCalled());

    act(() => {
      result.current.onPaste("あ。");
    });
    act(() => {
      result.current.onSelectGengo("ko");
    });

    expect(result.current.session?.gakushuGengo).toBe("ko");
    await waitFor(() => expect(store.logJsError).toHaveBeenCalled());
  });

  test("空の原文は貼れない", async () => {
    vi.mocked(store.listGenbun).mockResolvedValue([]);

    const { result } = renderHook(() => useGenbun());
    await waitFor(() => expect(store.listGenbun).toHaveBeenCalled());

    act(() => {
      result.current.onPaste("");
    });

    expect(result.current.session).toBeNull();
    expect(store.saveGenbun).not.toHaveBeenCalled();
  });

  test("一度選んだ学習言語は変えない", async () => {
    vi.mocked(store.listGenbun).mockResolvedValue([]);
    vi.mocked(store.saveGenbun).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGenbun());
    await waitFor(() => expect(store.listGenbun).toHaveBeenCalled());

    act(() => {
      result.current.onPaste("あ。");
    });
    act(() => {
      result.current.onSelectGengo("en");
    });
    const id = result.current.session?.id;
    act(() => {
      result.current.onSelectGengo("de");
    });

    await waitFor(() => expect(store.saveGenbun).toHaveBeenCalledOnce());
    expect(result.current.session?.gakushuGengo).toBe("en");
    expect(result.current.session?.id).toBe(id);
  });

  test("引用元が空でも貼れる", async () => {
    vi.mocked(store.listGenbun).mockResolvedValue([]);

    const { result } = renderHook(() => useGenbun());
    await waitFor(() => expect(store.listGenbun).toHaveBeenCalled());

    act(() => {
      result.current.onPaste("あ。", "");
    });

    expect(result.current.session?.body).toBe("あ。");
    expect(result.current.session?.inyoMoto).toBe("");
    expect(store.saveGenbun).not.toHaveBeenCalled();
  });

  test("引用元を書いて保存し、開き直すと残る", async () => {
    vi.mocked(store.listGenbun).mockResolvedValue([]);
    vi.mocked(store.saveGenbun).mockResolvedValue(undefined);
    vi.mocked(store.loadGenbun).mockImplementation(async (id) => ({
      id,
      body: "あ。",
      inyoMoto: "https://example.com/news",
      gakushuGengo: "en",
      createdAt: "2026-09-08T00:00:00.000Z",
      buns: [
        {
          body: "あ。",
          yakubun: "",
          tekisetsu: null,
          imi: null,
          bunpo: null,
          shiteki: null,
          naoshitaYakubun: null,
        },
      ],
    }));

    const { result } = renderHook(() => useGenbun());
    await waitFor(() => expect(store.listGenbun).toHaveBeenCalled());

    act(() => {
      result.current.onPaste("あ。", "https://example.com/news");
    });
    act(() => {
      result.current.onSelectGengo("en");
    });

    await waitFor(() => expect(store.saveGenbun).toHaveBeenCalled());
    expect(vi.mocked(store.saveGenbun).mock.calls[0]?.[0].inyoMoto).toBe(
      "https://example.com/news",
    );

    const id = result.current.session?.id;
    expect(id).toBeTruthy();

    act(() => {
      result.current.onChangeInyoMoto("書名");
    });
    await waitFor(() =>
      expect(vi.mocked(store.saveGenbun).mock.calls.at(-1)?.[0].inyoMoto).toBe("書名"),
    );

    await act(async () => {
      await result.current.onOpen(id!);
    });
    expect(result.current.session?.inyoMoto).toBe("https://example.com/news");
  });
});
