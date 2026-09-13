import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { GenbunSummary } from "../../lib/store";
import { GenbunIndex } from "./GenbunIndex";

function item(overrides: Partial<GenbunSummary> = {}): GenbunSummary {
  return {
    id: "g1",
    firstLine: "こんにちは。",
    inyoMoto: "",
    gakushuGengo: "en",
    createdAt: "2026-09-08T00:00:00.000Z",
    ...overrides,
  };
}

describe("GenbunIndex", () => {
  test("引用元が空なら出さない", () => {
    render(<GenbunIndex items={[item()]} onOpen={() => undefined} onDelete={() => undefined} />);
    expect(screen.queryByText("https://example.com/news")).toBeNull();
    expect(document.querySelector(".genbun-index-inyo")).toBeNull();
  });

  test("引用元があれば出す", () => {
    render(
      <GenbunIndex
        items={[item({ inyoMoto: "https://example.com/news" })]}
        onOpen={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(screen.getByText("https://example.com/news")).toBeTruthy();
  });

  test("開ける", () => {
    const onOpen = vi.fn<(id: string) => void>();
    render(<GenbunIndex items={[item()]} onOpen={onOpen} onDelete={() => undefined} />);
    fireEvent.click(screen.getByText("こんにちは。"));
    expect(onOpen).toHaveBeenCalledWith("g1");
  });
});
