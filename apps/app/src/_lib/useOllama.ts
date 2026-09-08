import { useEffect, useState } from "react";
import { canHantei, defaultSettings, type OllamaStatus, type Settings } from "./ollama";
import { fetchOllamaStatus, loadSettings, saveSettings } from "./store";

export function useOllama() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [nextSettings, nextStatus] = await Promise.all([loadSettings(), fetchOllamaStatus()]);
        if (!alive) {
          return;
        }
        setSettings(nextSettings);
        setStatus(nextStatus);
      } catch {
        if (!alive) {
          return;
        }
        setStatus({ kind: "unreachable" });
      } finally {
        if (alive) {
          setReady(true);
        }
      }
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
    } catch {
      setStatus({ kind: "unreachable" });
    }
  }

  async function onRecheck(): Promise<void> {
    try {
      const nextStatus = await fetchOllamaStatus();
      setStatus(nextStatus);
    } catch {
      setStatus({ kind: "unreachable" });
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
