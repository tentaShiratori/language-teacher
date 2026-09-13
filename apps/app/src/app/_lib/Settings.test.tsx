import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Settings } from "./Settings";
import * as debug from "../../lib/debug";
import * as errorLog from "../../lib/error_log";
import * as mado from "../../lib/openHanteiLogMado";

vi.mock("../../lib/debug", () => ({
  isDebug: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("../../lib/error_log", () => ({
  logCaughtError: vi.fn<() => void>(),
}));

vi.mock("../../lib/openHanteiLogMado", () => ({
  openHanteiLogMado: vi.fn<() => Promise<void>>(),
}));

const settingsValue = { ollamaBaseUrl: "http://127.0.0.1:11434", ollamaModel: "qwen3:8b" };

describe("Settings", () => {
  beforeEach(() => {
    vi.mocked(debug.isDebug).mockReset();
    vi.mocked(debug.isDebug).mockResolvedValue(true);
    vi.mocked(errorLog.logCaughtError).mockReset();
    vi.mocked(mado.openHanteiLogMado).mockReset();
    vi.mocked(mado.openHanteiLogMado).mockResolvedValue(undefined);
  });

  test("debug なら判定ログボタンから窓が開き、ログ本体は埋め込まない", async () => {
    render(<Settings value={settingsValue} onSave={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "設定" }));
    fireEvent.click(await screen.findByRole("button", { name: "判定ログ" }));
    expect(mado.openHanteiLogMado).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("判定ログ")).toBeNull();
    expect(screen.queryByText("ログはまだありません")).toBeNull();
  });

  test("本番なら判定ログボタンを出さない", async () => {
    vi.mocked(debug.isDebug).mockResolvedValue(false);
    render(<Settings value={settingsValue} onSave={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "設定" }));
    expect(screen.getByLabelText("Ollama の URL")).toBeTruthy();
    await waitFor(() => {
      expect(debug.isDebug).toHaveBeenCalled();
    });
    await vi.mocked(debug.isDebug).mock.results[0]?.value;
    expect(screen.queryByRole("button", { name: "判定ログ" })).toBeNull();
    expect(mado.openHanteiLogMado).not.toHaveBeenCalled();
  });

  test("isDebug 失敗なら判定ログボタンを出さない", async () => {
    const err = new Error("unavailable");
    vi.mocked(debug.isDebug).mockRejectedValue(err);
    render(<Settings value={settingsValue} onSave={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "設定" }));
    await waitFor(() => {
      expect(errorLog.logCaughtError).toHaveBeenCalledWith(err);
    });
    expect(screen.queryByRole("button", { name: "判定ログ" })).toBeNull();
  });
});
