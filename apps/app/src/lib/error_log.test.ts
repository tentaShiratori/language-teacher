import { afterEach, describe, expect, test, vi } from "vitest";
import { installGlobalErrorLog, logCaughtError } from "./error_log";
import * as store from "./store";

vi.mock("./store", () => ({
  logJsError: vi.fn<() => Promise<void>>(async () => undefined),
}));

afterEach(() => {
  vi.clearAllMocks();
  window.onerror = null;
});

describe("logCaughtError", () => {
  test("Error から message と stack を渡す", () => {
    const err = new Error("boom");
    logCaughtError(err);
    expect(store.logJsError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "boom",
        stack: err.stack ?? null,
      }),
    );
  });

  test("空 message の Error は name を使う", () => {
    logCaughtError(new Error(""));
    expect(store.logJsError).toHaveBeenCalledWith(expect.objectContaining({ message: "Error" }));
  });

  test("文字列はそのまま message になる", () => {
    logCaughtError("fail");
    expect(store.logJsError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "fail", stack: null }),
    );
  });

  test("null / undefined も文字列化する", () => {
    logCaughtError(null);
    expect(store.logJsError).toHaveBeenCalledWith(expect.objectContaining({ message: "null" }));
    logCaughtError(undefined);
    expect(store.logJsError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "undefined" }),
    );
  });

  test("オブジェクトは JSON にする", () => {
    logCaughtError({ code: 1 });
    expect(store.logJsError).toHaveBeenCalledWith(
      expect.objectContaining({ message: '{"code":1}', stack: null }),
    );
  });
});

describe("installGlobalErrorLog", () => {
  test("onerror で logJsError を呼ぶ", () => {
    installGlobalErrorLog();
    const err = new Error("window boom");
    window.onerror?.("window boom", "app.js", 1, 2, err);
    expect(store.logJsError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "window boom",
        stack: err.stack ?? null,
      }),
    );
  });

  test("unhandledrejection で logJsError を呼ぶ", () => {
    installGlobalErrorLog();
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new Error("reject"),
      }),
    );
    expect(store.logJsError).toHaveBeenCalledWith(expect.objectContaining({ message: "reject" }));
  });
});
