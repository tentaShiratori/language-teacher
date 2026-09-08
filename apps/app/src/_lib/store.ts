import { invoke } from "@tauri-apps/api/core";
import type { Bun } from "./bun";
import type { GakushuGengo } from "./gakushu_gengo";
import type { OllamaStatus, Settings } from "./ollama";

export type GenbunRecord = {
  id: string;
  body: string;
  gakushuGengo: GakushuGengo;
  createdAt: string;
  buns: Bun[];
};

export type GenbunSummary = {
  id: string;
  firstLine: string;
  gakushuGengo: GakushuGengo;
  createdAt: string;
};

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
