import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

function readGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: rootDir, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}

// Formato: AA.M.D.N  (ex: 26.6.10.3 = 10/jun/2026, 3ª build do dia)
const now = new Date();
const yy   = String(now.getFullYear()).slice(2);  // "26"
const m    = String(now.getMonth() + 1);          // "6"  (sem zero)
const d    = String(now.getDate());               // "10" (sem zero)
const dateKey = `${yy}.${m}.${d}`;               // "26.6.10"

const countFile = join(rootDir, "scripts", "buildcount.json");
let stored = { date: "", count: 0 };
if (existsSync(countFile)) {
  try { stored = JSON.parse(readFileSync(countFile, "utf8")); } catch { /* ignore */ }
}

const count = stored.date === dateKey ? stored.count + 1 : 1;
writeFileSync(countFile, JSON.stringify({ date: dateKey, count }, null, 2) + "\n");

const version = `${dateKey}.${count}`;

// Atualiza version no package.json
const packageJsonPath = join(rootDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
packageJson.version = version;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

// Artefatos de versão
const payload = {
  version,
  buildId: `${version}-${readGitCommit()}-${Date.now()}`,
  builtAt: now.toISOString(),
};

mkdirSync(join(rootDir, "public"), { recursive: true });
writeFileSync(join(rootDir, "public",  "version.json"),       `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(join(rootDir, "src", "lib", "appVersion.ts"),   `export const APP_VERSION = "${version}";\n`);

console.log(`[version] ${version}`);
