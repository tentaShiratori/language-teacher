import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function cargoBin(
  env: { CARGO_HOME?: string } = process.env,
  home: () => string = homedir,
  platform: NodeJS.Platform = process.platform,
  exists: (path: string) => boolean = existsSync,
): string {
  const cargoHome = env.CARGO_HOME ?? join(home(), ".cargo");
  const exe = platform === "win32" ? "cargo.exe" : "cargo";
  const bin = join(cargoHome, "bin", exe);
  return exists(bin) ? bin : "cargo";
}
