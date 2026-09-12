import { invoke } from "@tauri-apps/api/core";

export async function isDebug(): Promise<boolean> {
  return invoke<boolean>("is_debug");
}

export function applyDebugDataset(el: HTMLElement, debug: boolean): void {
  if (debug) {
    el.dataset.debug = "";
  } else {
    delete el.dataset.debug;
  }
}
