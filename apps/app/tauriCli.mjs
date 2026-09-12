import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const DEV_CONFIG = "src-tauri/tauri.dev.conf.json";

export function withDevConfig(args) {
  if (args[0] !== "dev") {
    return [...args];
  }
  if (args.includes("--config") || args.includes("-c")) {
    return [...args];
  }
  return [...args, "--config", DEV_CONFIG];
}

function cliEntry() {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("@tauri-apps/cli/package.json");
  const pkg = require(pkgPath);
  const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.tauri;
  return path.join(path.dirname(pkgPath), binRel);
}

function run() {
  const args = withDevConfig(process.argv.slice(2));
  const child = spawn(process.execPath, [cliEntry(), ...args], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.exit(1);
    }
    process.exit(code ?? 1);
  });
}

if (import.meta.main) {
  run();
}
