import { afterEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { applyHantei, type GenbunSession } from "./genbun";
import type { Hantei } from "./hantei";
import * as store from "./store";
import { useHantei } from "./useHantei";

vi.mock("./store", () => ({
  hanteiBun: vi.fn<() => Promise<Hantei>>(),
  logJsError: vi.fn<() => Promise<void>>(async () => undefined),
}));

type SetSession = (updater: (prev: GenbunSession | null) => GenbunSession | null) => void;

const ok: Hantei = { tekisetsu: true, imi: true, bunpo: true, shiteki: null, hinto: null };
const ng: Hantei = {
  tekisetsu: false,
  imi: false,
  bunpo: true,
  shiteki: null,
  hinto: "動詞がありません",
};

function emptyBun(body: string, yakubun = "") {
  return {
    body,
    yakubun,
    tekisetsu: null as boolean | null,
    imi: null as boolean | null,
    bunpo: null as boolean | null,
    shiteki: null as string | null,
    hinto: null as string | null,
  };
}

function baseSession(yakubun: string, selectedIndex = 0): GenbunSession {
  return {
    id: "s1",
    body: "あ。い。う。",
    gakushuGengo: "en",
    createdAt: "2026-09-08T00:00:00.000Z",
    buns: [emptyBun("あ。", yakubun), emptyBun("い。"), emptyBun("う。")],
    selectedIndex,
  };
}

function harness(session: GenbunSession, canHantei = true) {
  let current = session;
  const persist = vi.fn<() => Promise<void>>(async () => undefined);
  const setSession = vi.fn<SetSession>((updater) => {
    current = updater(current) as GenbunSession;
  });
  const hook = renderHook(() => useHantei({ session: current, canHantei, setSession, persist }));
  return {
    get current() {
      return current;
    },
    persist,
    result: hook.result,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useHantei", () => {
  test("Tab は判定して次へ進む", async () => {
    vi.mocked(store.hanteiBun).mockResolvedValue(ok);
    const h = harness(baseSession("Hello"));
    act(() => {
      h.result.current.onTab();
    });
    expect(h.current.selectedIndex).toBe(1);
    expect(h.persist).toHaveBeenCalled();
    await waitFor(() => expect(store.hanteiBun).toHaveBeenCalledOnce());
    await waitFor(() => expect(h.current.buns[0]?.tekisetsu).toBe(true));
  });

  test("空の訳文への Tab は判定せず次へ進む", () => {
    const h = harness(baseSession(""));
    act(() => {
      h.result.current.onTab();
    });
    expect(h.current.selectedIndex).toBe(1);
    expect(store.hanteiBun).not.toHaveBeenCalled();
    expect(h.result.current.isPending(0)).toBe(false);
    expect(h.persist).toHaveBeenCalled();
  });

  test("Ctrl+Enter は判定してその文に残る", async () => {
    vi.mocked(store.hanteiBun).mockResolvedValue(ng);
    const session = baseSession("", 1);
    session.buns[1] = emptyBun("い。", "Yes");
    const h = harness(session);
    act(() => {
      h.result.current.onCtrlEnter();
    });
    expect(h.current.selectedIndex).toBe(1);
    await waitFor(() => expect(h.current.buns[1]?.tekisetsu).toBe(false));
    expect(h.current.selectedIndex).toBe(1);
  });

  test("判定ボタンは Ctrl+Enter と同じ", async () => {
    vi.mocked(store.hanteiBun).mockResolvedValue(ok);
    const h = harness(baseSession("Hi"));
    act(() => {
      h.result.current.onHantei();
    });
    expect(h.current.selectedIndex).toBe(0);
    await waitFor(() => expect(store.hanteiBun).toHaveBeenCalledOnce());
  });

  test("判定中は isPending が true", async () => {
    let resolveHantei: (value: Hantei) => void = () => undefined;
    vi.mocked(store.hanteiBun).mockImplementation(
      () =>
        new Promise<Hantei>((resolve) => {
          resolveHantei = resolve;
        }),
    );
    const h = harness(baseSession("Hello"));
    act(() => {
      h.result.current.onCtrlEnter();
    });
    await waitFor(() => expect(h.result.current.isPending(0)).toBe(true));
    await act(async () => {
      resolveHantei(ok);
    });
    await waitFor(() => expect(h.result.current.isPending(0)).toBe(false));
  });

  test("やり直しは判定を上書きする", async () => {
    vi.mocked(store.hanteiBun).mockResolvedValue({
      ...ok,
      shiteki: "もっと自然に",
    });
    const h = harness(applyHantei(baseSession("Hello"), 0, { ...ng, hinto: "旧ヒント" }));
    act(() => {
      h.result.current.onCtrlEnter();
    });
    await waitFor(() => expect(h.current.buns[0]?.tekisetsu).toBe(true));
    expect(h.current.buns[0]?.shiteki).toBe("もっと自然に");
    expect(h.current.buns[0]?.hinto).toBeNull();
  });

  test("失敗しても前の判定は残す", async () => {
    vi.mocked(store.hanteiBun).mockRejectedValue(new Error("ollama down"));
    const h = harness(applyHantei(baseSession("Hello"), 0, { ...ok, shiteki: "残る指摘" }));
    act(() => {
      h.result.current.onCtrlEnter();
    });
    await waitFor(() => expect(h.result.current.errorOf(0)).toBe("ollama down"));
    expect(h.current.buns[0]?.tekisetsu).toBe(true);
    expect(h.current.buns[0]?.shiteki).toBe("残る指摘");
  });

  test("canHantei が false なら判定しない", () => {
    const h = harness(baseSession("Hello"), false);
    act(() => {
      h.result.current.onTab();
    });
    expect(h.current.selectedIndex).toBe(1);
    expect(store.hanteiBun).not.toHaveBeenCalled();
  });

  test("末尾の Tab は選択を動かさない", async () => {
    vi.mocked(store.hanteiBun).mockResolvedValue(ok);
    const session = baseSession("", 2);
    session.buns[2] = emptyBun("う。", "End");
    const h = harness(session);
    act(() => {
      h.result.current.onTab();
    });
    expect(h.current.selectedIndex).toBe(2);
    await waitFor(() => expect(store.hanteiBun).toHaveBeenCalled());
    await waitFor(() => expect(h.result.current.isPending(2)).toBe(false));
  });
});
