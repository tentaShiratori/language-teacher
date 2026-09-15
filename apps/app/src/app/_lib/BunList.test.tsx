import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { Bun } from "../../model/bun";
import "../../lib/app.css";
import { BunList } from "./BunList";

function bun(overrides: Partial<Bun> = {}): Bun {
  return {
    body: "短い文。",
    yakubun: "",
    tekisetsu: null,
    imi: null,
    bunpo: null,
    shiteki: null,
    naoshitaYakubun: null,
    ...overrides,
  };
}

function renderBunList(overrides: Partial<Parameters<typeof BunList>[0]> & { buns?: Bun[] } = {}) {
  const props = {
    buns: overrides.buns ?? [bun()],
    selectedIndex: overrides.selectedIndex ?? 0,
    canHantei: overrides.canHantei ?? true,
    isPending: overrides.isPending ?? (() => false),
    errorOf: overrides.errorOf ?? (() => null),
    onSelect: overrides.onSelect ?? vi.fn<(index: number) => void>(),
    onChangeYakubun: overrides.onChangeYakubun ?? vi.fn<(yakubun: string) => void>(),
    onTab: overrides.onTab ?? vi.fn<() => void>(),
    onCtrlEnter: overrides.onCtrlEnter ?? vi.fn<() => void>(),
    onHantei: overrides.onHantei ?? vi.fn<() => void>(),
    onMerge: overrides.onMerge ?? vi.fn<() => void>(),
    onResplit: overrides.onResplit ?? vi.fn<(caret: number) => void>(),
  };
  return { ...render(<BunList {...props} />), props };
}

describe("BunList", () => {
  test("選択中の文を折り返す読み取り専用 textarea で出す", () => {
    const longBody =
      "とても長い文が折り返されずに横スクロールだけになると訳文が書きづらいので全文が見えるようにする。";
    renderBunList({ buns: [bun({ body: longBody })] });

    const field = screen.getByLabelText("文（キャレット位置で再分割）");
    expect(field.tagName).toBe("TEXTAREA");
    expect(field).toHaveProperty("readOnly", true);
    expect(field).toHaveProperty("value", longBody);
    expect(field).toHaveProperty("wrap", "soft");
    expect(getComputedStyle(field).whiteSpace).toBe("pre-wrap");
    expect(document.querySelector(".bun-body-caret input")).toBeNull();
    expect(document.querySelector(".bun-body-caret textarea")).toBe(field);
  });

  test("空の文でも textarea で出せる", () => {
    renderBunList({ buns: [bun({ body: "" })] });
    const field = screen.getByLabelText("文（キャレット位置で再分割）");
    expect(field.tagName).toBe("TEXTAREA");
    expect(field).toHaveProperty("value", "");
  });

  test("再分割はキャレット位置（selectionStart）を渡す", () => {
    const onResplit = vi.fn<(caret: number) => void>();
    renderBunList({
      buns: [bun({ body: "あいうえお。" })],
      onResplit,
    });

    const field = screen.getByLabelText("文（キャレット位置で再分割）") as HTMLTextAreaElement;
    field.setSelectionRange(3, 3);
    fireEvent.click(screen.getByRole("button", { name: "再分割" }));

    expect(onResplit).toHaveBeenCalledWith(3);
  });

  test("キャレット未設定なら先頭（0）で再分割する", () => {
    const onResplit = vi.fn<(caret: number) => void>();
    renderBunList({
      buns: [bun({ body: "あいうえお。" })],
      onResplit,
    });

    fireEvent.click(screen.getByRole("button", { name: "再分割" }));
    expect(onResplit).toHaveBeenCalledWith(0);
  });

  test("折り返した長い文の途中キャレットでも再分割できる", () => {
    const onResplit = vi.fn<(caret: number) => void>();
    const longBody =
      "とても長い文が折り返されずに横スクロールだけになると訳文が書きづらいので全文が見えるようにする。";
    renderBunList({
      buns: [bun({ body: longBody })],
      onResplit,
    });

    const field = screen.getByLabelText("文（キャレット位置で再分割）") as HTMLTextAreaElement;
    const caret = Math.floor(longBody.length / 2);
    field.setSelectionRange(caret, caret);
    fireEvent.click(screen.getByRole("button", { name: "再分割" }));

    expect(onResplit).toHaveBeenCalledWith(caret);
  });
});
