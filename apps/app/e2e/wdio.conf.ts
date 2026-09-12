import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import "@wdio/local-runner";
import "@wdio/mocha-framework";
import "@wdio/spec-reporter";

const dir = fileURLToPath(new URL(".", import.meta.url));
const appRoot = path.resolve(dir, "..");
const srcTauri = path.join(appRoot, "src-tauri");

const driver = { process: undefined as ChildProcess | undefined, exiting: false };

function releaseApp(): string {
  const ext = process.platform === "win32" ? ".exe" : "";
  return path.join(srcTauri, "target", "release", `language_teacher${ext}`);
}

function tauriDriverBin(): string {
  const cargoHome = process.env.CARGO_HOME ?? path.join(os.homedir(), ".cargo");
  const name = process.platform === "win32" ? "tauri-driver.exe" : "tauri-driver";
  return path.join(cargoHome, "bin", name);
}

function run(command: string, args: string[], cwd: string, shell = false): void {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} が失敗した`);
  }
}

function closeTauriDriver(): void {
  driver.exiting = true;
  driver.process?.kill();
}

function onShutdown(fn: () => void): void {
  process.on("exit", fn);
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"] as const) {
    process.on(signal, () => {
      fn();
      process.exit();
    });
  }
}

onShutdown(() => {
  closeTauriDriver();
});

export const config = {
  hostname: "127.0.0.1",
  port: 4444,
  specs: ["./App.e2e.ts"],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      "wdio:enforceWebDriverClassic": true,
      "tauri:options": {
        application: releaseApp(),
      },
    },
  ],
  reporters: ["spec"],
  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  onPrepare: () => {
    run("pnpm", ["build"], appRoot, true);
    run("cargo", ["build", "--release"], srcTauri);
  },

  beforeSession: () => {
    driver.process = spawn(tauriDriverBin(), [], {
      stdio: [null, process.stdout, process.stderr],
    });
    driver.process.on("error", (error) => {
      console.error("tauri-driver error:", error);
      process.exit(1);
    });
    driver.process.on("exit", (code) => {
      if (!driver.exiting) {
        console.error("tauri-driver exited with code:", code);
        process.exit(1);
      }
    });
  },

  afterSession: () => {
    closeTauriDriver();
  },
};
