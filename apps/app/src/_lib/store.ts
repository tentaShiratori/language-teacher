import { invoke } from "@tauri-apps/api/core";
import type { GenbunRecord } from "../bindings/GenbunRecord";
import type { GenbunSummary } from "../bindings/GenbunSummary";
import type { Hantei } from "../bindings/Hantei";
import type { OllamaStatus } from "../bindings/OllamaStatus";
import type { Settings } from "../bindings/Settings";
import type { GakushuGengo } from "./gakushu_gengo";

export type { GenbunRecord } from "../bindings/GenbunRecord";
export type { GenbunSummary } from "../bindings/GenbunSummary";

export function isGakushuGengo(value: string): value is GakushuGengo {
  return value === "en" || value === "zh_hans" || value === "ko" || value === "de";
}

export async function saveGenbun(record: GenbunRecord): Promise<void> {
  await invoke("save_genbun", { record });
}

export async function listGenbun(): Promise<GenbunSummary[]> {
  return invoke<GenbunSummary[]>("list_genbun");
}

export async function loadGenbun(id: string): Promise<GenbunRecord | null> {
  return invoke<GenbunRecord | null>("load_genbun", { id });
}

export async function deleteGenbun(id: string): Promise<void> {
  await invoke("delete_genbun", { id });
}

export async function fetchOllamaStatus(): Promise<OllamaStatus> {
  return invoke<OllamaStatus>("ollama_status");
}

export async function loadSettings(): Promise<Settings> {
  return invoke<Settings>("load_settings");
}

export async function saveSettings(settings: Settings): Promise<OllamaStatus> {
  return invoke<OllamaStatus>("save_settings", { settings });
}

export async function hanteiBun(input: {
  gakushuGengo: GakushuGengo;
  genbun: string;
  bun: string;
  yakubun: string;
}): Promise<Hantei> {
  return invoke<Hantei>("hantei_bun", {
    gakushuGengo: input.gakushuGengo,
    genbun: input.genbun,
    bun: input.bun,
    yakubun: input.yakubun,
  });
}
