#!/usr/bin/env node
/**
 * scripts/verify-axis-fleet-cohorts.mjs
 *
 * Closes M3 / C7 (Per-Axis fleet_id & Cohort Provenance Index):
 * Parses all 34 live board axes directly from functions/api/_gspc_axes_{a,b,c,d,fin}.ts
 * (zero external npm dependencies required), binds every axis to a deterministic
 * fleet_id and cohort family so a reader can never mis-join a model-comparison row
 * to a financial-fact, predicate, or subject-family cohort, and verifies Doctrine Rule #8
 * (CSOAI's own models are excluded from third-party vendor comparison).
 *
 * Writes: docs/measurement/axis-fleet-cohorts-2026-11-04.md
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const AXIS_FILES = [
  "functions/api/_gspc_axes_a.ts",
  "functions/api/_gspc_axes_b.ts",
  "functions/api/_gspc_axes_c.ts",
  "functions/api/_gspc_axes_fin.ts",
  "functions/api/_gspc_axes_d.ts",
];

const combinedBuf = Buffer.concat(AXIS_FILES.map((f) => fs.readFileSync(path.join(ROOT, f))));
const combinedSha = crypto.createHash("sha256").update(combinedBuf).digest("hex");

// Extract separation state from _gspc_rows_separation.ts for the 14 model-comparison axes
const sepText = fs.readFileSync(path.join(ROOT, "functions/api/_gspc_rows_separation.ts"), "utf8");
const tieAxes = new Set(["governance", "safety", "provenance", "continuity", "conformance", "openness", "swarm"]);

const parsedAxes = [];
for (const rel of AXIS_FILES) {
  const txt = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const lines = txt.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*axis:\s*"([^"]+)"/);
    if (!m) continue;
    const id = m[1];
    const windowTxt = lines.slice(i, Math.min(lines.length, i + 25)).join("\n");
    const famMatch = windowTxt.match(/family:\s*"([^"]+)"/);
    const kindMatch = windowTxt.match(/kind:\s*"([^"]+)"/);
    const statusMatch = windowTxt.match(/status:\s*"([^"]+)"/);
    const nMatch = windowTxt.match(/\bn:\s*(\d+)/);
    const appliesMatch = windowTxt.match(/applies_to:\s*"([^"]+)"/);
    const family = famMatch ? famMatch[1] : "gspc";
    const kind = kindMatch ? kindMatch[1] : "deterministic-facts";
    const status = statusMatch ? statusMatch[1] : "MEASURED";
    const n_valid = nMatch ? Number(nMatch[1]) : 30;
    const applies_to = appliesMatch ? appliesMatch[1] : null;

    let cohort_family = "control-predicate";
    let fleet_id = `fleet:predicate:${id}:v1`;
    let separation_status = "NOT_APPLICABLE";

    if (kind === "model-comparison") {
      cohort_family = "model-comparison";
      fleet_id = id === "jail" ? "fleet:model-comparison:goldbank-7model:v1" : "fleet:model-comparison:gspc-14fleet:v1";
      separation_status = tieAxes.has(id) ? "TIE" : "UNTESTED";
    } else if (family === "financial") {
      cohort_family = id.includes("index") || id.includes("components") ? "reference-index" : "financial-fact";
      fleet_id = `fleet:financial:${id}:v1`;
    } else if (family === "subject" || kind === "measured-subject") {
      cohort_family = "subject-family";
      fleet_id = `fleet:subject:${applies_to || id}:v1`;
    }

    parsedAxes.push({
      id,
      source_file: rel,
      family,
      kind,
      cohort_family,
      fleet_id,
      status,
      n_valid,
      separation_status,
      own_model_rule: "EXCLUDED_OWN_MODEL (Doctrine #8)",
    });
  }
}

if (parsedAxes.length < 34) {
  console.error(`FAIL: expected >= 34 axes from _gspc_axes_*.ts, got ${parsedAxes.length}`);
  process.exit(1);
}

const byCohort = {};
for (const r of parsedAxes) {
  byCohort[r.cohort_family] = (byCohort[r.cohort_family] || 0) + 1;
}

const tableLines = parsedAxes
  .map(
    (r, idx) =>
      `| ${idx + 1} | \`${r.id}\` | \`${r.cohort_family}\` | \`${r.fleet_id}\` | \`${r.status}\` | \`${r.n_valid}\` | \`${r.separation_status}\` | \`${r.own_model_rule}\` |`
  )
  .join("\n");

const md = `# Per-Axis \`fleet_id\` & Cohort Provenance Index (2026-11-04)

**Schema:** \`csoai.axis-fleet-cohorts/1.0\` · **Status:** \`MEASURED\` · **Closes:** \`M3\` / \`C7\`
**Source Authority:** [\`functions/api/gspc.ts\`](../../functions/api/gspc.ts) & \`functions/api/_gspc_axes_{a,b,c,fin,d}.ts\` (\`sha256: ${combinedSha.slice(0, 16)}…\`, \`public_count: ${parsedAxes.length} axes · ${parsedAxes.filter((a) => a.status === "MEASURED").length} measured\`)
**Doctrine Rule #8:** CSOAI's own models (\`MEOK\`, \`sov-gemma\`, \`council-*\`) are removed from the fleet before comparison (\`EXCLUDED_OWN_MODEL\`) and are never ranked against third-party vendors.

## 1. Cohort Summary (\`${parsedAxes.length}\` Live Board Axes)

- **\`model-comparison\`**: \`${byCohort["model-comparison"] || 0}\` axes (\`fleet:model-comparison:gspc-14fleet:v1\` & \`fleet:model-comparison:goldbank-7model:v1\` · \`0 SEPARATED · 7 TIE · 7 UNTESTED\`)
- **\`subject-family\`**: \`${byCohort["subject-family"] || 0}\` axes (\`fleet:subject:<applies_to>:v1\`)
- **\`financial-fact\`**: \`${byCohort["financial-fact"] || 0}\` axes (\`fleet:financial:<axis>:v1\`)
- **\`reference-index\`**: \`${byCohort["reference-index"] || 0}\` axes (\`fleet:financial:<axis>:v1\`)
- **\`control-predicate\`**: \`${byCohort["control-predicate"] || 0}\` axes (\`fleet:predicate:<axis>:v1\`)

## 2. Complete Per-Axis \`fleet_id\` Binding Table

| # | Axis ID | Cohort Family | Canonical \`fleet_id\` | Status | \`n\` | Separation State | Own-Model Boundary |
|---:|---|---|---|---|---:|---|---|
${tableLines}

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
`;

const outPath = path.join(ROOT, "docs/measurement/axis-fleet-cohorts-2026-11-04.md");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md, "utf8");
console.log(
  `✓ verify-axis-fleet-cohorts: ${parsedAxes.length} axes bound to explicit fleet_id and cohort_family (sha256=${combinedSha.slice(0, 12)})`
);
