import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { HanteiLogHyoji } from "./HanteiLogHyoji";
import type { HanteiLogLine } from "../../../lib/store";

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

describe("HanteiLogHyoji", () => {
  test("空ならログなしと出す", () => {
    render(<HanteiLogHyoji items={[]} />);
    expect(screen.getByText("ログはまだありません")).toBeTruthy();
  });

  test("成功行はプロンプト・応答・判定を出す", () => {
    render(
      <HanteiLogHyoji
        items={[
          baseLine({
            hantei: {
              tekisetsu: true,
              imi: true,
              bunpo: true,
              shiteki: "もう少し自然に",
              naoshitaYakubun: null,
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText("system prompt body")).toBeTruthy();
    expect(screen.getByText("user prompt body")).toBeTruthy();
    expect(screen.getByText('{"tekisetsu":true}')).toBeTruthy();
    expect(screen.getByText("適切")).toBeTruthy();
    expect(screen.getByText("もう少し自然に")).toBeTruthy();
  });

  test("不適切なら指摘と直した訳文を出し意味／文法は出さない", () => {
    render(
      <HanteiLogHyoji
        items={[
          baseLine({
            hantei: {
              tekisetsu: false,
              imi: false,
              bunpo: false,
              shiteki: "動詞がありません",
              naoshitaYakubun: "I went to school.",
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText("不適切")).toBeTruthy();
    expect(screen.getByText("動詞がありません")).toBeTruthy();
    expect(screen.getByLabelText("直した訳文").textContent).toBe("I went to school.");
    expect(screen.queryByText("意味")).toBeNull();
    expect(screen.queryByText("文法")).toBeNull();
  });

  test("失敗行は応答と失敗理由を出す", () => {
    render(
      <HanteiLogHyoji
        items={[
          baseLine({
            messageContent: "not json",
            error: "JSON オブジェクトが無い",
          }),
        ]}
      />,
    );
    expect(screen.getByText("not json")).toBeTruthy();
    expect(screen.getByText("パース失敗: JSON オブジェクトが無い")).toBeTruthy();
  });
});
