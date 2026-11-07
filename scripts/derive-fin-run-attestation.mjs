#!/usr/bin/env node
/**
 * derive-fin-run-attestation.mjs — the board's financial run_attestation is DERIVED, never typed.
 *
 * WHY THIS EXISTS (2026-11-02). functions/api/_gspc_axes_fin.ts carried a typed
 * `run_attestation: "CONTENT_ADDRESSED_UNSIGNED"` per axis — the exact "a typed value where a
 * pointer belongs" defect the estate keeps repairing. The work plan's D17 named it: closing A14
 * needs the run artefacts signed AND the board's source to READ their signature. The signing is
 * owner-gated; the reading is engineering, so the reading is built first: this generator derives
 * each axis's attestation state from the artefact bytes on disk and rewrites the module. When a
 * run artefact gains its signature, the board flips without a source edit.
 *
 * The rule, applied to each financial axis:
 *   - the axis's `evidence_url` names the run artefact under public/;
 *   - that artefact carries a non-empty `signature` string  -> "ED25519_SIGNED";
 *   - anything else (missing artefact, missing signature)   -> "CONTENT_ADDRESSED_UNSIGNED".
 * An artefact that cannot be read is CONTENT_ADDRESSED_UNSIGNED, never an invented state.
 *
 * --check (the build:client mode): exit non-zero if the module disagrees with the derived state.
 * Default mode: rewrite the module's run_attestation lines in place, surgically, per axis block.
 * Any other edit to the module is this script's business never.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MODULE = join(ROOT, "functions", "api", "_gspc_axes_fin.ts");
const SIGNED = "ED25519_SIGNED";
const UNSIGNED = "CONTENT_ADDRESSED_UNSIGNED";

/** Axis id -> derived attestation state, from the artefact bytes under public/. */
export function deriveAll(moduleSource = readFileSync(MODULE, "utf8"), publicDir = join(ROOT, "public")) {
  const out = {};
  // Each axis block is introduced by `axis: "<id>"` and holds both evidence_url and run_attestation.
  const blockRe = /axis:\s*"([a-z0-9-]+)"[\s\S]*?(?=\n  \{\n    axis:|$)/g;
  let m;
  while ((m = blockRe.exec(moduleSource)) !== null) {
    const block = m[0];
    const axis = m[1];
    const urlMatch = block.match(/evidence_url:\s*"([^"]+)"/);
    if (!urlMatch) continue; // no evidence pointer -> nothing to derive from; leave the line to a human
    const artefactPath = urlMatch[1].startsWith("/") ? urlMatch[1].slice(1) : urlMatch[1];
    const artefactFile = join(publicDir, artefactPath);
    let state = UNSIGNED;
    if (existsSync(artefactFile)) {
      try {
        const artefact = JSON.parse(readFileSync(artefactFile, "utf8"));
        // A signature may be a bare string or a structured object (alg/key/value);
        // either shape counts when it is present and non-empty. Absent, empty or
        // unparsable all read as unsigned — an unreadable claim is an unsigned claim.
        const sig = artefact.signature;
        const present =
          (typeof sig === "string" && sig.trim()) ||
          (sig && typeof sig === "object" && Object.keys(sig).length > 0);
        if (present) state = SIGNED;
      } catch {
        // unparsable artefact: an unreadable claim is an unsigned claim
        state = UNSIGNED;
      }
    }
    out[axis] = { state, artefactPath };
  }
  return out;
}

/** Surgical rewrite: replace only the run_attestation value inside each named axis block. */
export function rewriteModule(moduleSource, derived) {
  let changed = 0;
  const lines = moduleSource.split("\n");
  let currentAxis = null;
  for (let i = 0; i < lines.length; i++) {
    const axisMatch = lines[i].match(/^\s*axis:\s*"([a-z0-9-]+)"/);
    if (axisMatch) currentAxis = axisMatch[1];
    const att = lines[i].match(/^(\s*run_attestation:\s*")([A-Z0-9_]+)(",\s*)$/);
    if (att && currentAxis && derived[currentAxis]) {
      const want = derived[currentAxis].state;
      if (att[2] !== want) {
        lines[i] = `${att[1]}${want}${att[3]}`;
        changed++;
      }
    }
  }
  return { source: lines.join("\n"), changed };
}

function main() {
  const check = process.argv.includes("--check");
  const moduleSource = readFileSync(MODULE, "utf8");
  const derived = deriveAll(moduleSource);
  if (!Object.keys(derived).length) {
    console.error("✗ fin-run-attestation: no axis blocks with an evidence_url were found");
    process.exit(11);
  }
  const { source, changed } = rewriteModule(moduleSource, derived);
  const summary = Object.entries(derived)
    .map(([axis, d]) => `${axis}=${d.state === SIGNED ? "SIGNED" : "unsigned"}`)
    .join(" ");
  if (check) {
    if (changed) {
      console.error(`✗ fin-run-attestation: module disagrees with artefact bytes (${summary}) — run the generator without --check`);
      process.exit(11);
    }
    console.log(`✓ fin-run-attestation: module agrees with artefact bytes · ${summary}`);
    return;
  }
  if (changed) {
    writeFileSync(MODULE, source);
    console.log(`✓ fin-run-attestation: rewrote ${changed} run_attestation value(s) · ${summary}`);
  } else {
    console.log(`· fin-run-attestation: module already agrees · ${summary}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
