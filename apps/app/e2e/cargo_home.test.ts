import path from "node:path";
import { cargoHomeBin } from "./cargo_home";

test("CARGO_HOME があるときはその bin を使う", () => {
  expect(cargoHomeBin("cargo", { CARGO_HOME: "/opt/cargo" }, () => "/home/me", "linux")).toBe(
    path.join("/opt/cargo", "bin", "cargo"),
  );
});

test("CARGO_HOME が無いときはホームの .cargo/bin を使う", () => {
  expect(cargoHomeBin("cargo", {}, () => "/home/me", "linux")).toBe(
    path.join("/home/me", ".cargo", "bin", "cargo"),
  );
});

test("win32 では exe を付ける", () => {
  expect(
    cargoHomeBin("tauri-driver", { CARGO_HOME: "C:\\cargo" }, () => "C:\\Users\\me", "win32"),
  ).toBe(path.join("C:\\cargo", "bin", "tauri-driver.exe"));
});
