#!/usr/bin/env node
/** NEXT_300 #289 — ban GPU/RunPod templates for RWA attestation churn. */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const files = [
  "docs/RUNPOD_POLICY.md",
  "docs/ORACLE_FLEET.md",
].map((f) => join(ROOT, f));

let ok = true;
for (const f of files) {
  if (!existsSync(f)) {
    console.error("missing", f);
    ok = false;
    continue;
  }
  const t = readFileSync(f, "utf8");
  if (!/not|ban|forbid|do not|never/i.test(t) || !/RWA|attestation|churn/i.test(t)) {
    console.error("no-gpu-contract-churn-lint: expected ban language in", f);
    ok = false;
  }
}

/** Fail if a RunPod/GPU template file positively schedules RWA attestation churn. */
const TEMPLATE_DIRS = ["runpod", "templates/runpod", "infra/runpod"].map((d) => join(ROOT, d));
const badPhrase =
  /(?:runpod|gpu).{0,120}(?:rwa|attestation).{0,80}(?:churn|publish|sign)|(?:rwa|attestation).{0,80}(?:churn).{0,80}(?:runpod|gpu)/i;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(md|json|ya?ml|toml|sh|mjs|ts)$/i.test(name)) acc.push(p);
  }
  return acc;
}

for (const dir of TEMPLATE_DIRS) {
  for (const p of walk(dir)) {
    const t = readFileSync(p, "utf8");
    if (badPhrase.test(t) && !/do not|never|ban|forbid|not authorize/i.test(t)) {
      console.error("no-gpu-contract-churn-lint: RWA GPU churn template", p);
      ok = false;
    }
  }
}

if (!ok) process.exit(1);
console.log("no-gpu-contract-churn-lint OK — RunPod/oracle docs ban RWA GPU churn");
