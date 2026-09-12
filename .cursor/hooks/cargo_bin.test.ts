import { expect, test } from "vitest";
import { join } from "node:path";
import { cargoBin } from "./cargo_bin.ts";

test("実体があるときは CARGO_HOME の bin を返す", () => {
  expect(cargoBin({ CARGO_HOME: "/opt/cargo" }, () => "/home/me", "linux", () => true)).toBe(
    join("/opt/cargo", "bin", "cargo"),
  );
});

test("実体が無いときは cargo に落とす", () => {
  expect(cargoBin({ CARGO_HOME: "/missing" }, () => "/home/me", "linux", () => false)).toBe("cargo");
});

test("win32 では exe を付ける", () => {
  expect(cargoBin({ CARGO_HOME: "C:\\cargo" }, () => "C:\\Users\\me", "win32", () => true)).toBe(
    join("C:\\cargo", "bin", "cargo.exe"),
  );
});
