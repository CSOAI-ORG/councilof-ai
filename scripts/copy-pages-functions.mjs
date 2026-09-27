#!/usr/bin/env node
import { cpSync, existsSync, rmSync } from "node:fs";
import { basename, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SOURCE = resolve(REPO, "functions");
const DEFAULT_DEST = resolve(REPO, "dist/client/functions");

export function includeFunctionPath(sourcePath, sourceRoot = SOURCE) {
  const rel = relative(sourceRoot, resolve(sourcePath));
  if (!rel || rel.startsWith(".." + sep) || rel === "..") return true;
  const parts = rel.split(sep);
  if (parts.includes("__fixtures__")) return false;
  const name = basename(rel);
  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(name)) return false;
  return true;
}

export function copyPagesFunctions(destination = DEFAULT_DEST) {
  const dest = resolve(destination);
  if (dest === SOURCE || SOURCE.startsWith(dest + sep)) {
    throw new Error("Refusing destination that contains the source tree");
  }
  rmSync(dest, { recursive: true, force: true });
  cpSync(SOURCE, dest, {
    recursive: true,
    filter: (source) => includeFunctionPath(source, SOURCE),
  });
  if (!existsSync(dest)) throw new Error("Functions copy did not materialise");
  return dest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--dest");
  const dest = at >= 0 ? process.argv[at + 1] : DEFAULT_DEST;
  if (at >= 0 && !dest) throw new Error("--dest requires a directory");
  console.log("pages functions copied to", copyPagesFunctions(dest));
}
