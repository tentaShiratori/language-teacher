import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Settings } from "./Settings";
import * as mado from "./openHanteiLogMado";

vi.mock("./openHanteiLogMado", () => ({
  openHanteiLogMado: vi.fn<() => Promise<void>>(),
}));

describe("Settings", () => {
  beforeEach(() => {
    vi.mocked(mado.openHanteiLogMado).mockReset();
    vi.mocked(mado.openHanteiLogMado).mockResolvedValue(undefined);
  });

  test("判定ログボタンは別ウィンドウを開き、ログ本体は埋め込まない", () => {
    render(
      <Settings
        value={{ ollamaBaseUrl: "http://127.0.0.1:11434", ollamaModel: "qwen3:8b" }}
        onSave={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "設定" }));
    fireEvent.click(screen.getByRole("button", { name: "判定ログ" }));
    expect(mado.openHanteiLogMado).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("判定ログ")).toBeNull();
    expect(screen.queryByText("ログはまだありません")).toBeNull();
  });
});
