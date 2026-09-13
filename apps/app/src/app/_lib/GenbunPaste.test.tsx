import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { GenbunPaste } from "./GenbunPaste";

describe("GenbunPaste", () => {
  test("原文が空なら進めない", () => {
    const onPaste = vi.fn<(body: string, inyoMoto: string) => void>();
    render(<GenbunPaste onPaste={onPaste} />);
    expect(screen.getByRole("button", { name: "進む" })).toHaveProperty("disabled", true);
    fireEvent.submit(screen.getByRole("button", { name: "進む" }).closest("form")!);
    expect(onPaste).not.toHaveBeenCalled();
  });

  test("引用元が空でも原文があれば進める", () => {
    const onPaste = vi.fn<(body: string, inyoMoto: string) => void>();
    render(<GenbunPaste onPaste={onPaste} />);
    fireEvent.change(screen.getByLabelText("原文"), { target: { value: "こんにちは。" } });
    fireEvent.click(screen.getByRole("button", { name: "進む" }));
    expect(onPaste).toHaveBeenCalledWith("こんにちは。", "");
  });

  test("引用元を書いて進める", () => {
    const onPaste = vi.fn<(body: string, inyoMoto: string) => void>();
    render(<GenbunPaste onPaste={onPaste} />);
    fireEvent.change(screen.getByLabelText("原文"), { target: { value: "こんにちは。" } });
    fireEvent.change(screen.getByLabelText("引用元"), {
      target: { value: "https://example.com/news" },
    });
    fireEvent.click(screen.getByRole("button", { name: "進む" }));
    expect(onPaste).toHaveBeenCalledWith("こんにちは。", "https://example.com/news");
  });
});
