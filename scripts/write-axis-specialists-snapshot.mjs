#!/usr/bin/env node
/**
 * write-axis-specialists-snapshot.mjs — write a DATED capture of the board for the axis
 * specialists to audit against.
 *
 * WHY A NEW FILE EACH TIME. The previous capture
 * (council-os/axis-specialists/board-2026-10-28.snapshot.json) carries the site's own
 * Ed25519 attestation over its bytes. Signed bytes are superseded, never edited: changing
 * one row of a signed capture would leave a signature over bytes that no longer exist, and
 * a signature that does not commit to the bytes beside it is not evidence of anything. So a
 * board change produces a NEW dated capture and the old one stays exactly as it was, as the
 * historical record of the board on the day it was taken.
 *
 * WHAT IT IS. The capture is the board this commit computes, offline, with the SAME code the
 * served Function runs (scripts/surface/commit-board.mjs). The site's own attestation is
 * applied at deploy time, when the Pages secret holds the key; offline there is no key, so
 * this capture says so rather than carrying a signature it cannot produce.
 *
 *   node scripts/write-axis-specialists-snapshot.mjs --date 2026-10-29
 *   node scripts/write-axis-specialists-snapshot.mjs --date 2026-10-29 --check
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { commitBoard } from "./surface/commit-board.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(REPO, "council-os", "axis-specialists");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const date = arg("--date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error("usage: write-axis-specialists-snapshot.mjs --date YYYY-MM-DD [--check]");
    process.exitCode = 2;
    return;
  }
  const out = join(OUT_DIR, `board-${date}.snapshot.json`);
  const res = await commitBoard(REPO);
  const board = JSON.parse(res.raw);
  const capture = {
    ...board,
    // No key offline. The site's attestation is applied at deploy; this capture must not
    // borrow the previous one's signature over different bytes.
    site_attestation: null,
    site_attestation_note:
      "This capture is UNSIGNED: the site's board attestation key is a Pages secret and is " +
      "applied at deploy time, and this file was written offline from the board this commit " +
      "computes. The signed capture of the previous board is retained unchanged beside it. " +
      "The attestation attests the integrity of the board as published by the site; it is not " +
      "a re-measurement.",
  };
  const encoded = Buffer.from(JSON.stringify(capture, null, 2) + "\n", "utf8");

  if (process.argv.includes("--check")) {
    const current = existsSync(out) ? readFileSync(out, "utf8") : null;
    if (current !== encoded.toString("utf8")) {
      console.error(`stale: ${out} differs from a fresh capture of this commit's board`);
      process.exitCode = 1;
      return;
    }
    console.log(`axis specialists snapshot current: ${out}`);
    return;
  }
  writeFileSync(out, encoded);
  const axes = capture.axes?.length ?? 0;
  const measured = capture.totals?.measured_axes ?? null;
  console.log(`wrote ${out}: ${axes} axes · ${measured} measured · ${capture.totals?.public_count}`);
}

await main();
