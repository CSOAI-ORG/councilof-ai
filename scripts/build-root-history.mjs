#!/usr/bin/env node
/**
 * build-root-history.mjs — the root index behind /api/receipts/batch.
 *
 * WHY THIS EXISTS (2026-09-02):
 *   /api/receipts/latest is an honest UNPUBLISHED stub: no settlement-receipt stream exists on
 *   Pages, so there is no payment-receipt history to batch. What the estate DOES have, hourly,
 *   is a signed public root (public/root.json, Ed25519 under did:web:csoai.org#board-attestation-1)
 *   over card-v0 leaves, each leaf shipping its Merkle inclusion path. Every published root is a
 *   git commit ("public-root: adapters → cards → merkle"), but a Pages Function cannot read git,
 *   and a leaf wrapper does not record WHICH root its proof path was cut against. This file is
 *   the bridge: one static index of every root this checkout can see, so a historical batch can
 *   name the root(s) that carried each leaf and a stranger can recompute the path against them.
 *
 * WHAT IT WRITES: public/receipts/root-history.json —
 *   { schema, count, source, roots: [ { as_of, merkle_root, card_count, card_sha256[], sig_ed25519,
 *     did_intended, commit } ] } sorted by as_of ascending, one entry per distinct merkle_root.
 *
 * WHERE THE ROOTS COME FROM (merged, deduped by merkle_root, never invented):
 *   1. the committed public/receipts/root-history.json (so history compounds across shallow
 *      checkouts — GHA actions/checkout defaults to depth 1 and would otherwise see one root),
 *   2. `git log -- public/root.json` + `git show <commit>:public/root.json` when git is available,
 *   3. the current public/root.json.
 *   A root that cannot be parsed is skipped and counted, never guessed.
 *
 * DETERMINISM: no timestamps are written; re-running on an unchanged corpus writes identical
 * bytes. `commit` is null for a root that arrived via (1) or (3) with no git provenance visible.
 *
 * Run: node scripts/build-root-history.mjs   (wired into `npm run build:client`; the public-root
 * workflow should run it before `git add public/` so the index compounds hourly — a follow-up
 * one-liner in .github/workflows/public-root.yml, not done here to avoid colliding with PR #1163).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT_JSON = join(ROOT, "public", "root.json");
const OUT_DIR = join(ROOT, "public", "receipts");
const OUT = join(OUT_DIR, "root-history.json");
const HEX64 = /^[0-9a-f]{64}$/;
const MAX_GIT_ROOTS = 2000;

function entryFrom(raw, commit) {
  if (!raw || typeof raw !== "object") return null;
  const merkle_root = typeof raw.merkle_root === "string" ? raw.merkle_root.toLowerCase() : "";
  if (!HEX64.test(merkle_root) || typeof raw.as_of !== "string" || !raw.as_of) return null;
  const shas = Array.isArray(raw.card_sha256) ? raw.card_sha256.filter((s) => typeof s === "string" && HEX64.test(s)) : [];
  return {
    as_of: raw.as_of,
    merkle_root,
    card_count: typeof raw.card_count === "number" ? raw.card_count : shas.length,
    card_sha256: shas,
    sig_ed25519: typeof raw.sig_ed25519 === "string" ? raw.sig_ed25519 : null,
    did_intended: typeof raw.did_intended === "string" ? raw.did_intended : null,
    commit: commit || null,
  };
}

const byRoot = new Map();
let skipped = 0;
const add = (e) => {
  if (!e) {
    skipped++;
    return;
  }
  const prev = byRoot.get(e.merkle_root);
  // Keep the richer record: a git-provenanced entry wins over one without a commit.
  if (!prev || (!prev.commit && e.commit)) byRoot.set(e.merkle_root, e);
};

// 1. committed index
let fromCommitted = 0;
if (existsSync(OUT)) {
  try {
    const prev = JSON.parse(readFileSync(OUT, "utf8"));
    for (const r of Array.isArray(prev.roots) ? prev.roots : []) {
      add(entryFrom(r, r.commit));
      fromCommitted++;
    }
  } catch {
    console.warn("[root-history] existing index unreadable — rebuilding from git + current root");
  }
}

// 2. git history (best effort; absent in a non-git or depth-1 checkout)
let fromGit = 0;
try {
  const log = execFileSync("git", ["log", "--format=%H", `--max-count=${MAX_GIT_ROOTS}`, "--", "public/root.json"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  for (const commit of log.split("\n").map((s) => s.trim()).filter(Boolean)) {
    try {
      const body = execFileSync("git", ["show", `${commit}:public/root.json`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      add(entryFrom(JSON.parse(body), commit));
      fromGit++;
    } catch {
      skipped++;
    }
  }
} catch {
  console.warn("[root-history] git history unavailable — index carries the committed roots + the current root only");
}

// 3. the root shipping with this build
let current = null;
try {
  current = entryFrom(JSON.parse(readFileSync(ROOT_JSON, "utf8")), null);
  add(current);
} catch {
  console.warn("[root-history] public/root.json unreadable — current root not indexed");
}

const roots = [...byRoot.values()].sort((a, b) => (a.as_of < b.as_of ? -1 : a.as_of > b.as_of ? 1 : a.merkle_root.localeCompare(b.merkle_root)));
const out = {
  schema: "csoai.root-history/0.1",
  count: roots.length,
  first_as_of: roots.length ? roots[0].as_of : null,
  last_as_of: roots.length ? roots[roots.length - 1].as_of : null,
  source:
    "Every distinct public root this checkout could see: the committed index, git history of public/root.json, and the root shipping with this build. Each root is the bytes the public-root workflow signed at that hour; nothing here is re-signed or invented. Missing hours are missing — a gap is visible, never filled.",
  generated_by: "scripts/build-root-history.mjs",
  not_a_certification: true,
  roots,
};
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`[root-history] ${roots.length} distinct root(s) → public/receipts/root-history.json (committed ${fromCommitted}, git ${fromGit}, current ${current ? 1 : 0}, skipped ${skipped})`);
