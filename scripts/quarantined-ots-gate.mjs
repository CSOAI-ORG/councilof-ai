#!/usr/bin/env node
/** Exact-byte register for historical OTS proofs withheld from the served tree. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTER = "public/interop/ots/quarantine-2026-09-24.json";
const QUARANTINE = "evidence/quarantine/ots";

function filesBelow(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesBelow(path) : entry.isFile() ? [path] : [];
  });
}

export function checkQuarantine(root = REPO) {
  const doc = JSON.parse(readFileSync(join(root, REGISTER), "utf8"));
  if (doc.schema !== "csoai.ots-quarantine/0.1" || !Array.isArray(doc.entries)) {
    throw new Error("quarantine register schema mismatch");
  }
  if (doc.counts?.quarantined !== doc.entries.length) {
    throw new Error("quarantine count mismatch");
  }
  const manifest = JSON.parse(readFileSync(join(root, "public/interop/ots/manifest.json"), "utf8"));
  const published = new Set((manifest.proofs || []).map((row) => row.path));
  const seenUrls = new Set();
  const seenSources = new Set();
  let interop = 0;
  for (const entry of doc.entries) {
    const url = entry.former_public_url;
    if (!/^\/(interop|press)\/[A-Za-z0-9_./-]+\.ots$/.test(url) || url.split("/").some((part) => part === "." || part === "..")) {
      throw new Error("unsafe former URL");
    }
    const expected = join(QUARANTINE, url.slice(1));
    if (entry.retained_repo_path !== expected || seenUrls.has(url) || seenSources.has(expected)) {
      throw new Error("quarantine path mismatch or duplicate");
    }
    seenUrls.add(url);
    seenSources.add(expected);
    if (url.startsWith("/interop/")) interop += 1;
    if (published.has(url)) throw new Error(`quarantined URL still in current manifest: ${url}`);
    if (existsSync(join(root, "public", url.slice(1)))) {
      throw new Error(`quarantined proof still served: ${url}`);
    }
    const source = join(root, expected);
    if (!existsSync(source) || !statSync(source).isFile()) throw new Error(`missing retained bytes: ${url}`);
    const bytes = readFileSync(source);
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (entry.bytes !== bytes.length || entry.sha256 !== digest) {
      throw new Error(`retained bytes differ from register: ${url}`);
    }
  }
  if (doc.counts.interop_manifest_removed !== interop) throw new Error("interop count mismatch");
  const retained = filesBelow(join(root, QUARANTINE)).map((path) => relative(root, path));
  if (retained.length !== seenSources.size || retained.some((path) => !seenSources.has(path))) {
    throw new Error("unregistered quarantined proof bytes");
  }
  return { quarantined: seenSources.size, interopManifestRemoved: interop };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkQuarantine();
  console.log(`quarantined-ots-gate: PASS — ${result.quarantined} exact files retained; ${result.interopManifestRemoved} removed from current interop manifest`);
}
