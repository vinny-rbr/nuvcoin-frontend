import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));

function readGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: rootDir, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}

const payload = {
  version: packageJson.version,
  buildId: `${packageJson.version}-${readGitCommit()}-${Date.now()}`,
  builtAt: new Date().toISOString(),
};

mkdirSync(join(rootDir, "public"), { recursive: true });
writeFileSync(join(rootDir, "public", "version.json"), `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(join(rootDir, "src", "lib", "appVersion.ts"), `export const APP_VERSION = "${packageJson.version}";\n`);
