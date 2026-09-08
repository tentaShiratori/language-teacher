const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "qwen3:8b";

export const OLLAMA_MODELS = ["qwen3:8b", "qwen3:14b"] as const;

export type OllamaModel = (typeof OLLAMA_MODELS)[number];

export type Settings = {
  ollamaBaseUrl: string;
  ollamaModel: string;
};

export type OllamaStatus =
  | { kind: "ok" }
  | { kind: "unreachable" }
  | { kind: "modelMissing"; model: string };

export function defaultSettings(): Settings {
  return {
    ollamaBaseUrl: DEFAULT_OLLAMA_BASE_URL,
    ollamaModel: DEFAULT_OLLAMA_MODEL,
  };
}

export function canHantei(status: OllamaStatus | null): boolean {
  return status?.kind === "ok";
}

export function isOllamaModel(value: string): value is OllamaModel {
  return (OLLAMA_MODELS as readonly string[]).includes(value);
}

/** 失敗理由ごとの先頭で出す案内。手順本体は OllamaSetup が出す。 */
export function setupLead(status: OllamaStatus): string | null {
  if (status.kind === "ok") {
    return null;
  }
  if (status.kind === "unreachable") {
    return "Ollama に届かない。インストールと、トレイで Ollama が動いているかを先に確認する。";
  }
  return `Ollama はあるがモデル「${status.model}」が無い。ollama pull だけを先に行う。`;
}
