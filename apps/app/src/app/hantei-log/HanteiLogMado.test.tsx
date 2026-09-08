import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { HanteiLogMado } from "./HanteiLogMado";
import * as store from "../../lib/store";
import type { HanteiLogLine } from "../../lib/store";

vi.mock("../../lib/store", () => ({
  listHanteiLog: vi.fn<() => Promise<HanteiLogLine[]>>(),
}));

vi.mock("../../lib/error_log", () => ({
  logCaughtError: vi.fn<() => void>(),
}));

function baseLine(overrides: Partial<HanteiLogLine> = {}): HanteiLogLine {
  return {
    at: "2026-09-08T12:00:00.000Z",
    model: "qwen3:8b",
    systemPrompt: "system prompt body",
    userPrompt: "user prompt body",
    messageContent: '{"tekisetsu":true}',
    ...overrides,
  };
}

describe("HanteiLogMado", () => {
  beforeEach(() => {
    vi.mocked(store.listHanteiLog).mockReset();
  });

  test("空ならログなしと出す", async () => {
    vi.mocked(store.listHanteiLog).mockResolvedValue([]);
    render(<HanteiLogMado />);
    expect(await screen.findByText("ログはまだありません")).toBeTruthy();
  });

  test("成功行はプロンプト・応答・判定を出す", async () => {
    vi.mocked(store.listHanteiLog).mockResolvedValue([
      baseLine({
        hantei: {
          tekisetsu: true,
          imi: true,
          bunpo: true,
          shiteki: "もう少し自然に",
          hinto: null,
          kasho: [],
        },
      }),
    ]);
    render(<HanteiLogMado />);
    expect(await screen.findByText("適切")).toBeTruthy();
    expect(screen.getByText("system prompt body")).toBeTruthy();
    expect(screen.getByText("もう少し自然に")).toBeTruthy();
  });

  test("失敗行はパース失敗を出す", async () => {
    vi.mocked(store.listHanteiLog).mockResolvedValue([
      baseLine({
        messageContent: "not json",
        error: "JSON オブジェクトが無い",
      }),
    ]);
    render(<HanteiLogMado />);
    expect(await screen.findByText("パース失敗: JSON オブジェクトが無い")).toBeTruthy();
  });

  test("読み込み失敗ならエラーを出す", async () => {
    vi.mocked(store.listHanteiLog).mockRejectedValue(new Error("boom"));
    render(<HanteiLogMado />);
    await waitFor(() => {
      expect(screen.getByText("ログを読めませんでした")).toBeTruthy();
    });
  });
});
