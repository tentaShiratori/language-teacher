import os from "node:os";
import path from "node:path";
import process from "node:process";

export function cargoHomeBin(
  name: string,
  env: { CARGO_HOME?: string } = process.env,
  homedir: () => string = os.homedir,
  platform: NodeJS.Platform = process.platform,
): string {
  const cargoHome = env.CARGO_HOME ?? path.join(homedir(), ".cargo");
  const exe = platform === "win32" ? `${name}.exe` : name;
  return path.join(cargoHome, "bin", exe);
}
