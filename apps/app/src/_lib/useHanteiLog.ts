import { useEffect, useState } from "react";
import { logCaughtError } from "./error_log";
import { listHanteiLog, type HanteiLogLine } from "./store";

export type HanteiLogStatus = "loading" | "ok" | "error";

export function useHanteiLog(): { items: HanteiLogLine[]; status: HanteiLogStatus } {
  const [items, setItems] = useState<HanteiLogLine[]>([]);
  const [status, setStatus] = useState<HanteiLogStatus>("loading");

  useEffect(() => {
    let alive = true;
    void listHanteiLog()
      .then((lines) => {
        if (!alive) {
          return;
        }
        setItems(lines);
        setStatus("ok");
      })
      .catch((err) => {
        if (!alive) {
          return;
        }
        setItems([]);
        setStatus("error");
        logCaughtError(err);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { items, status };
}
