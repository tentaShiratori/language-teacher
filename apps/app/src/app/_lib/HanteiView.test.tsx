import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { Bun } from "../../model/bun";
import { HanteiView } from "./HanteiView";

function bun(overrides: Partial<Bun> = {}): Bun {
  return {
    body: "行きます。",
    yakubun: "I go.",
    tekisetsu: null,
    imi: null,
    bunpo: null,
    shiteki: null,
    naoshitaYakubun: null,
    ...overrides,
  };
}

describe("HanteiView", () => {
  test("未判定で待ちもエラーもなければ出さない", () => {
    const { container } = render(<HanteiView bun={bun()} pending={false} error={null} />);
    expect(container.firstChild).toBeNull();
  });

  test("適切なら短い指摘を出す", () => {
    render(
      <HanteiView
        bun={bun({ tekisetsu: true, imi: true, bunpo: true, shiteki: "このままで自然" })}
        pending={false}
        error={null}
      />,
    );
    expect(screen.getByText("適切")).toBeTruthy();
    expect(screen.getByText("このままで自然")).toBeTruthy();
    expect(screen.queryByLabelText("自然な訳文")).toBeNull();
    expect(screen.queryByLabelText("直した訳文")).toBeNull();
    expect(screen.queryByText("意味")).toBeNull();
    expect(screen.queryByText("文法")).toBeNull();
    expect(document.querySelector(".hantei-hinto")).toBeNull();
    expect(document.querySelector(".hantei-ketsujo")).toBeNull();
  });

  test("適切でより自然な訳文があれば自然な訳文として出す", () => {
    render(
      <HanteiView
        bun={bun({
          tekisetsu: true,
          imi: true,
          bunpo: true,
          shiteki: "もう少し自然に",
          naoshitaYakubun: "I went.",
        })}
        pending={false}
        error={null}
      />,
    );
    expect(screen.getByText("適切")).toBeTruthy();
    expect(screen.getByText("もう少し自然に")).toBeTruthy();
    expect(screen.getByLabelText("自然な訳文").textContent).toBe("I went.");
    expect(screen.queryByLabelText("直した訳文")).toBeNull();
  });

  test("不適切なら指摘と直した訳文を出し意味／文法は出さない", () => {
    render(
      <HanteiView
        bun={bun({
          tekisetsu: false,
          imi: false,
          bunpo: false,
          shiteki: "動詞がありません",
          naoshitaYakubun: "I went to school.",
        })}
        pending={false}
        error={null}
      />,
    );
    expect(screen.getByText("不適切")).toBeTruthy();
    expect(screen.getByText("動詞がありません")).toBeTruthy();
    expect(screen.getByLabelText("直した訳文").textContent).toBe("I went to school.");
    expect(screen.queryByText("意味")).toBeNull();
    expect(screen.queryByText("文法")).toBeNull();
    expect(screen.queryByText("^")).toBeNull();
    expect(document.querySelector(".hantei-hinto")).toBeNull();
    expect(document.querySelector(".hantei-ketsujo")).toBeNull();
  });

  test("空の指摘は出さない", () => {
    render(
      <HanteiView
        bun={bun({ tekisetsu: true, imi: true, bunpo: true, shiteki: "" })}
        pending={false}
        error={null}
      />,
    );
    expect(screen.getByText("適切")).toBeTruthy();
    expect(document.querySelector(".hantei-shiteki")).toBeNull();
  });

  test("判定中とエラーを出す", () => {
    render(<HanteiView bun={bun()} pending={true} error="ollama down" />);
    expect(screen.getByText("判定中")).toBeTruthy();
    expect(screen.getByText("ollama down")).toBeTruthy();
  });
});
