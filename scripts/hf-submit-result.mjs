#!/usr/bin/env node
/**
 * Submit a GSPC leaderboard result via HF dataset PR pattern.
 * Usage: node scripts/hf-submit-result.mjs path/to/submission.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { basename, join } from "node:path";

const submissionPath = process.argv[2];
if (!submissionPath) {
  console.error("Usage: node scripts/hf-submit-result.mjs <submission.json>");
  process.exit(1);
}

const sub = JSON.parse(readFileSync(submissionPath, "utf8"));
const model = sub.model?.replace(/[^a-zA-Z0-9._-]/g, "-") || "unknown";
const date = (sub.submitted_at || new Date().toISOString()).slice(0, 10);
const dataset = sub.pr?.target_repo || "csoai/gspc-leaderboard-results";
const work = `/tmp/hf-gspc-submit-${model}-${date}`;

mkdirSync(work, { recursive: true });
try {
  execSync(`git clone https://huggingface.co/datasets/${dataset} ${work}`, { stdio: "inherit" });
} catch {
  console.error(`Clone failed. Create dataset first: hf repos create ${dataset} --type dataset --public`);
  process.exit(1);
}

const outDir = join(work, "submissions", model, date);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "submission.json"), JSON.stringify(sub, null, 2));
writeFileSync(join(work, "submissions", `${model}-${date}.json`), JSON.stringify(sub, null, 2));

execSync(`cd ${work} && git checkout -b submission/${model}-${date} && git add -A && git commit -m "Add result: ${model}"`, {
  stdio: "inherit",
});
console.log(`\nPushed branch ready. Open PR on https://huggingface.co/datasets/${dataset}`);
console.log(`Or: cd ${work} && git push -u origin submission/${model}-${date}`);
