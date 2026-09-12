import { describe, expect, test } from "vitest";
import { withDevConfig } from "./tauriCli.mjs";

describe("withDevConfig", () => {
  test("tauri dev に開発用 config を付ける", () => {
    expect(withDevConfig(["dev"])).toEqual(["dev", "--config", "src-tauri/tauri.dev.conf.json"]);
  });

  test("本番ビルドは config を付けない", () => {
    expect(withDevConfig(["build"])).toEqual(["build"]);
    expect(withDevConfig(["build", "--debug"])).toEqual(["build", "--debug"]);
  });

  test("既に --config があるときは重ねない", () => {
    expect(withDevConfig(["dev", "--config", "other.json"])).toEqual([
      "dev",
      "--config",
      "other.json",
    ]);
    expect(withDevConfig(["dev", "-c", "other.json"])).toEqual(["dev", "-c", "other.json"]);
  });

  test("dev 以外と空は変えない", () => {
    expect(withDevConfig([])).toEqual([]);
    expect(withDevConfig(["info"])).toEqual(["info"]);
    expect(withDevConfig(["android", "dev"])).toEqual(["android", "dev"]);
  });
});
