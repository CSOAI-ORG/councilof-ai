#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const TAG = '<script src="/council-workspace-launcher.js" defer></script>';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? htmlFiles(path)
      : path.endsWith(".html")
        ? [path]
        : [];
  });
}

let changed = 0;
for (const path of htmlFiles(PUBLIC)) {
  const source = readFileSync(path, "utf8");
  if (source.includes("/council-workspace-launcher.js")) continue;
  const next = /<\/body>/i.test(source)
    ? source.replace(/<\/body>/i, `  ${TAG}\n</body>`)
    : `${source.trimEnd()}\n${TAG}\n`;
  if (next !== source) {
    writeFileSync(path, next);
    changed += 1;
  }
}

console.log(`[workspace-launcher] ${changed} static HTML pages aligned`);
