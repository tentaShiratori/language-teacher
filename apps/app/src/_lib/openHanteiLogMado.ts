import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { HANTEI_LOG_PATH } from "./appRoutes";

const HANTEI_LOG_MADO_LABEL = "hantei-log";
const HANTEI_LOG_MADO_URL = `/#${HANTEI_LOG_PATH}`;

export async function openHanteiLogMado(): Promise<void> {
  const existing = await WebviewWindow.getByLabel(HANTEI_LOG_MADO_LABEL);
  if (existing !== null) {
    await existing.setFocus();
    return;
  }

  const created = new WebviewWindow(HANTEI_LOG_MADO_LABEL, {
    url: HANTEI_LOG_MADO_URL,
    title: "判定ログ",
    width: 720,
    height: 640,
  });

  await new Promise<void>((resolve, reject) => {
    created.once("tauri://created", () => {
      resolve();
    });
    created.once("tauri://error", (event) => {
      reject(new Error(String(event.payload)));
    });
  });
}
