#!/usr/bin/env node
/**
 * Stage static Pages assets without public/proofs/.
 *
 * /proofs/* is deliberately served from the external evidence mirror through the
 * committed redirect. Copying those 4k+ files into Vite's outDir first and deleting
 * them later wastes disk and can fail before the deletion step ever runs.
 */
import { cpSync, existsSync, lstatSync, rmSync } from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_SOURCE = resolve(REPO, "public");
const DEFAULT_DEST = resolve(REPO, "dist/client");

export function includePublicPath(sourcePath, sourceRoot = DEFAULT_SOURCE) {
  const rel = relative(resolve(sourceRoot), resolve(sourcePath));
  if (!rel) return true;
  if (rel === ".." || rel.startsWith(".." + sep)) return false;
  return rel.split(sep)[0] !== "proofs";
}

export function stagePagesPublic(source = DEFAULT_SOURCE, destination = DEFAULT_DEST) {
  const src = resolve(source);
  const dest = resolve(destination);
  if (!existsSync(src) || !lstatSync(src).isDirectory()) {
    throw new Error("Public source directory is missing");
  }
  if (dest === src || dest.startsWith(src + sep) || src.startsWith(dest + sep)) {
    throw new Error("Source and destination must be disjoint");
  }
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, {
    recursive: true,
    filter: (path) => includePublicPath(path, src),
  });
  if (!existsSync(dest)) throw new Error("Staged Pages tree did not materialise");
  if (existsSync(resolve(dest, "proofs"))) {
    throw new Error("Excluded proofs directory reached the staged Pages tree");
  }
  return { source: src, destination: dest };
}

function arg(name) {
  const at = process.argv.indexOf(name);
  if (at < 0) return null;
  if (!process.argv[at + 1]) throw new Error(name + " requires a path");
  return process.argv[at + 1];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = stagePagesPublic(arg("--source") || DEFAULT_SOURCE, arg("--dest") || DEFAULT_DEST);
  console.log("staged Pages public assets (proofs excluded)", result.destination);
}
