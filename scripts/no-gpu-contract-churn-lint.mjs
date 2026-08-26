#!/usr/bin/env node
/** NEXT_300 #289 — ban GPU/RunPod templates for RWA attestation churn. */
import { readFileSync, existsSync } from "node:fs";
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
if (!ok) process.exit(1);
console.log("no-gpu-contract-churn-lint OK — RunPod/oracle docs ban RWA GPU churn");
