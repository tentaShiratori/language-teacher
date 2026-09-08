import { describe, expect, test } from "vitest";
import { canHantei, defaultSettings, isOllamaModel, setupLead, type OllamaStatus } from "./ollama";

describe("canHantei", () => {
  test("ok のときだけ判定できる", () => {
    expect(canHantei({ kind: "ok" })).toBe(true);
  });

  test("未検知と失敗は判定できない", () => {
    expect(canHantei(null)).toBe(false);
    expect(canHantei({ kind: "unreachable" })).toBe(false);
    expect(canHantei({ kind: "modelMissing", model: "qwen3:8b" })).toBe(false);
  });
});

describe("setupLead", () => {
  test("ok は案内なし", () => {
    expect(setupLead({ kind: "ok" })).toBeNull();
  });

  test("届かないときはインストールを先に", () => {
    const lead = setupLead({ kind: "unreachable" });
    expect(lead).toContain("届かない");
    expect(lead).toContain("インストール");
  });

  test("モデル無しは pull を先に", () => {
    const status: OllamaStatus = { kind: "modelMissing", model: "qwen3:14b" };
    const lead = setupLead(status);
    expect(lead).toContain("qwen3:14b");
    expect(lead).toContain("ollama pull");
  });
});

describe("defaultSettings / isOllamaModel", () => {
  test("既定値", () => {
    expect(defaultSettings()).toEqual({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3:8b",
    });
  });

  test("選択肢のモデルだけ受け付ける", () => {
    expect(isOllamaModel("qwen3:8b")).toBe(true);
    expect(isOllamaModel("qwen3:14b")).toBe(true);
    expect(isOllamaModel("")).toBe(false);
    expect(isOllamaModel("llama3")).toBe(false);
  });
});
