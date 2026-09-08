import { useEffect, useState } from "react";
import { logCaughtError } from "./error_log";
import { canHantei, defaultSettings, type OllamaStatus, type Settings } from "./ollama";
import { fetchOllamaStatus, loadSettings, saveSettings } from "./store";

export function useOllama() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      // 設定読込の失敗で検知結果を潰さない（起動時の Ollama 判定を独立させる）
      const [settingsResult, statusResult] = await Promise.allSettled([
        loadSettings(),
        fetchOllamaStatus(),
      ]);
      if (!alive) {
        return;
      }
      if (settingsResult.status === "fulfilled") {
        setSettings(settingsResult.value);
      } else {
        logCaughtError(settingsResult.reason);
      }
      if (statusResult.status === "fulfilled") {
        setStatus(statusResult.value);
      } else {
        logCaughtError(statusResult.reason);
        setStatus({ kind: "unreachable" });
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onSaveSettings(next: Settings): Promise<void> {
    try {
      const nextStatus = await saveSettings(next);
      setSettings(next);
      setStatus(nextStatus);
    } catch (e) {
      logCaughtError(e);
      setStatus({ kind: "unreachable" });
      throw e;
    }
  }

  async function onRecheck(): Promise<void> {
    try {
      const nextStatus = await fetchOllamaStatus();
      setStatus(nextStatus);
    } catch (e) {
      logCaughtError(e);
      setStatus({ kind: "unreachable" });
      throw e;
    }
  }

  return {
    ready,
    status,
    settings,
    canHantei: canHantei(status),
    onSaveSettings,
    onRecheck,
  };
}
