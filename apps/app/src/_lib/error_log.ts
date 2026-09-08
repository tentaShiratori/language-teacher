import type { ErrorLogLine } from "../bindings/ErrorLogLine";
import { logJsError } from "./store";

function toErrorLogLine(err: unknown, at = new Date().toISOString()): ErrorLogLine {
  if (err instanceof Error) {
    return {
      at,
      message: err.message === "" ? err.name : err.message,
      stack: err.stack ?? null,
    };
  }
  if (typeof err === "string") {
    return { at, message: err, stack: null };
  }
  if (err === null || err === undefined) {
    return { at, message: String(err), stack: null };
  }
  try {
    return { at, message: JSON.stringify(err), stack: null };
  } catch {
    return { at, message: String(err), stack: null };
  }
}

export function logCaughtError(err: unknown): void {
  void logJsError(toErrorLogLine(err)).catch(() => {
    // ログ書き込み自体の失敗では再帰しない
  });
}

export function installGlobalErrorLog(): void {
  window.onerror = (message, source, lineno, colno, error) => {
    const line =
      error instanceof Error
        ? toErrorLogLine(error)
        : {
            at: new Date().toISOString(),
            message: String(message),
            stack:
              source !== undefined && source !== ""
                ? `${String(source)}:${String(lineno)}:${String(colno)}`
                : null,
          };
    void logJsError(line).catch(() => {
      // ログ書き込み自体の失敗では再帰しない
    });
    return false;
  };

  window.addEventListener("unhandledrejection", (event) => {
    logCaughtError(event.reason);
  });
}
