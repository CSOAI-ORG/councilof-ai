#!/usr/bin/env node
/**
 * check-prerender — read prerender-report.json HONESTLY.
 *
 * WHY THIS EXISTS (2026-08-26): the report's failure field is `err`, but every
 * ad-hoc verification in this repo read `errored`/`error` — a field that has
 * never existed. So a run where the browser died on 515 of 581 routes reported
 * "0 errored" and looked clean. A verifier that cannot observe failure is not a
 * verifier. This reads the real fields and ALSO cross-checks the report against
 * the HTML actually written to disk, because a report is a claim and the files
 * are the evidence.
 */
import fs from "node:fs";
import path from "node:path";

const dist = process.argv[2] || "dist/client";
const reportPath = "prerender-report.json";
if (!fs.existsSync(reportPath)) {
  console.error("check-prerender: no prerender-report.json — the prerender did not complete.");
  process.exit(2);
}
const raw = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.routes || []);
const errored = rows.filter((r) => r.err);
// A route the prerenderer deliberately REFUSED (it renders the honest-404, so writing a
// snapshot would ship a hard "Page Not Found" that answers 200) is not thin and not an
// error — it is the prerenderer working. Count it separately and name it.
const skipped404 = rows.filter((r) => r.skipped404);
const thin = rows.filter((r) => !r.ok && !r.err && !r.skipped404);
const ok = rows.filter((r) => r.ok);

const countHtml = (d) => {
  let n = 0;
  const walk = (p) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const f = path.join(p, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name === "index.html") n++;
    }
  };
  if (fs.existsSync(d)) walk(d);
  return n;
};
const onDisk = countHtml(dist);

console.log(`  routes ${rows.length} | ok ${ok.length} | thin ${thin.length} | errored ${errored.length} | refused-404 ${skipped404.length}`);
if (skipped404.length) console.log(`  refused (no route, honest-404, nothing written): ${skipped404.map((r) => r.route).join(", ")}`);
console.log(`  html on disk ${onDisk}`);
if (errored.length) {
  console.error(`✗ prerender: ${errored.length} route(s) FAILED. First 3:`);
  for (const r of errored.slice(0, 3)) console.error(`    ${r.route}: ${r.err}`);
  process.exit(1);
}
// A report claiming N ok while far fewer files exist is a lying report.
if (onDisk < ok.length * 0.95) {
  console.error(`✗ prerender: report claims ${ok.length} ok but only ${onDisk} index.html on disk — report contradicts the filesystem.`);
  process.exit(1);
}
if (thin.length) { console.error(`✗ prerender: ${thin.length} thin route(s).`); process.exit(1); }
console.log("✓ prerender: report and filesystem agree; 0 thin, 0 errored.");
