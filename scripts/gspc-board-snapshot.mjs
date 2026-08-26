#!/usr/bin/env node
/**
 * gspc-board-snapshot.mjs — materialise the live /api/gspc payload as a file.
 *
 * WHY: the board is computed at the edge by a Pages Function, so the counts it
 * publishes exist only in a response. To sign a board snapshot through the
 * signing custody — and to let a stranger verify that snapshot offline — the
 * payload has to become bytes on disk. This runs the REAL onRequestGet, with no
 * signing key in the environment, and writes what it returns. It does not
 * reimplement the totals: reimplementing them is how two numbers diverge.
 *
 *   node scripts/gspc-board-snapshot.mjs [out.json]
 *
 * The env is deliberately empty of BOARD_SIGN_KEY_PKCS8_B64 so no
 * site_attestation field appears. The custody signature is applied afterwards,
 * over exactly these bytes.
 */
import { build } from "esbuild";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const out = process.argv[2] || ".gspc-work/gspc-board.snapshot.json";

const dir = mkdtempSync(join(tmpdir(), "gspc-snap-"));
const bundle = join(dir, "gspc.mjs");

await build({
  entryPoints: [resolve("functions/api/gspc.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  outfile: bundle,
  logLevel: "warning",
});

const { onRequestGet } = await import("file://" + bundle);

const res = await onRequestGet({
  request: new Request("https://councilof.ai/api/gspc"),
  env: {}, // no signing key — site_attestation is intentionally absent
});
const text = await res.text();
const body = JSON.parse(text);

if (body.site_attestation) {
  console.error("snapshot: refusing to write — a site_attestation leaked into the snapshot");
  process.exit(2);
}

writeFileSync(out, JSON.stringify(body, null, 1) + "\n");

const t = body.totals;
console.log(`gspc-board-snapshot -> ${out}`);
console.log(`  axes            : ${t.axes}`);
console.log(`  measured_axes   : ${t.measured_axes}`);
console.log(`  unmeasured_axes : ${t.unmeasured_axes}`);
console.log(`  public_count    : ${t.public_count}`);
console.log(`  by_family       : gspc ${t.by_family.gspc.measured}/${t.by_family.gspc.axes} · financial ${t.by_family.financial.measured}/${t.by_family.financial.axes}`);
console.log(`  comparison_axes : ${t.comparison_axes} (separated ${t.separated_leads}, ties ${t.ties}, untested ${t.untested_separations})`);
