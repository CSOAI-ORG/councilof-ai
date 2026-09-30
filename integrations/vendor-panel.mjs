#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// One copier for every wrapper: the published panel bundle (public/panel/gspc-panel.js, built by
// packages/gspc-panel/scripts/build.mjs) goes, byte for byte, to each place a wrapper serves it
// from; the OpenShift chart also carries the standalone page. `--check` fails on any drift.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const check = process.argv.includes("--check");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const bundle = readFileSync(resolve(here, "../public/panel/gspc-panel.js"));
const copies = [
  ["openshift-console-plugin/src/vendor/gspc-panel.js", bundle],
  ["openshift-console-plugin/standalone/gspc-panel.js", bundle],
  ["openshift-console-plugin/charts/gspc-evidence-plugin/files/gspc-panel.js", bundle],
  ["crowdstrike-foundry/ui/extensions/gspc-evidence/src/gspc-panel.js", bundle],
  ["splunk-app/gspc_evidence/appserver/static/gspc-panel.js", bundle],
];
for (const f of ["index.html", "standalone.js", "standalone.css"])
  copies.push([`openshift-console-plugin/charts/gspc-evidence-plugin/files/${f}`, readFileSync(resolve(here, "openshift-console-plugin/standalone", f))]);
let bad = 0;
for (const [rel, bytes] of copies) {
  const p = resolve(here, rel);
  if (check) {
    if (!existsSync(p) || !readFileSync(p).equals(bytes)) {
      console.error(`DRIFT ${rel}`);
      bad++;
    }
  } else {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, bytes);
  }
}
console.log(`gspc-panel.js sha256 ${sha(bundle)} -> ${copies.length} copies ${check ? (bad ? "DRIFTED" : "match") : "written"}`);
process.exit(bad ? 1 : 0);
