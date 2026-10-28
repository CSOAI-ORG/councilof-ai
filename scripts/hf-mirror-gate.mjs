#!/usr/bin/env node
/**
 * hf-mirror-gate.mjs — verify HF mirror has the files BEFORE allowing exclusion from Pages deploy.
 *
 * WHY: deploy-exclusions.json lists directories that leave the Pages upload and are served via
 * 302 redirects to csoai/councilof-ai-evidence on Hugging Face. If a directory is listed but
 * not yet synced to HF, the redirect would land on a 404. This gate spot-checks one file per
 * excluded directory to ensure the mirror exists before the exclusion is safe to apply.
 *
 * The actual sync happens via evidence_sync.py (hf-evidence-sync.yml workflow). This gate
 * runs in CI to block a merge that would create 302→404 redirects.
 *
 * Usage:
 *   node scripts/hf-mirror-gate.mjs                  # check mode (default)
 *   node scripts/hf-mirror-gate.mjs --selftest       # run selftest only
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MANIFEST = resolve(ROOT, "scripts/deploy-exclusions.json");
const PUBLIC = resolve(ROOT, "public");
const HF_RESOLVE = "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/";

async function headRequest(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "csoai-hf-mirror-gate/1.0" },
    });
    clearTimeout(timeout);
    return res.status;
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") return "TIMEOUT";
    return "ERROR";
  }
}

function findSampleFile(dirPath) {
  if (!existsSync(dirPath)) return null;
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && !e.name.startsWith(".")) {
      return e.name;
    }
    if (e.isDirectory() && !e.name.startsWith(".")) {
      const nested = findSampleFile(join(dirPath, e.name));
      if (nested) return join(e.name, nested);
    }
  }
  return null;
}

async function main() {
  if (process.argv.includes("--selftest")) {
    // Check a known file from proofs/ (not a directory - HF returns 404 for directory paths)
    const sampleFile = "proofs/001e8bd830605eb1.json";
    console.log(`hf-mirror-gate: selftest — checking known good path (${sampleFile})`);
    const status = await headRequest(HF_RESOLVE + sampleFile);
    if (status !== 200 && status !== 301 && status !== 302 && status !== 307) {
      console.error(`✗ selftest FAILED: ${sampleFile} returned ${status}`);
      process.exit(1);
    }
    console.log(`✓ selftest OK: ${sampleFile} returned ${status}`);
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  // Only check directories that are NOT mirror_only (those are the ones being excluded)
  const dirs = manifest.entries.filter((e) => e.kind === "dir" && !e.mirror_only);

  console.log(`hf-mirror-gate: checking ${dirs.length} directory exclusions against HF mirror`);

  const missing = [];
  const verified = [];

  for (const entry of dirs) {
    const localDir = resolve(PUBLIC, entry.path);
    const sample = findSampleFile(localDir);

    if (!sample) {
      console.log(`· ${entry.path}: no local files (skipping HF check)`);
      continue;
    }

    const hfUrl = HF_RESOLVE + entry.path + "/" + sample;
    const status = await headRequest(hfUrl);

    if (status === 200 || status === 302 || status === 307) {
      console.log(`✓ ${entry.path}: HF mirror verified (${sample} → ${status})`);
      verified.push(entry.path);
    } else {
      console.error(`✗ ${entry.path}: HF mirror MISSING (${sample} → ${status})`);
      console.error(`  URL checked: ${hfUrl}`);
      missing.push(entry.path);
    }
  }

  console.log();
  if (missing.length > 0) {
    console.error(`✗ hf-mirror-gate: ${missing.length} exclusion(s) have no HF mirror:`);
    for (const p of missing) {
      console.error(`    - ${p}`);
    }
    console.error();
    console.error("These directories are in deploy-exclusions.json but not on HF.");
    console.error("Merging would create 302 redirects that land on 404s.");
    console.error();
    console.error("To fix: merge PR-A (#3339) first, which triggers hf-evidence-sync to upload");
    console.error("the files to HF. Then this gate will pass.");
    process.exit(1);
  }

  console.log(`✓ hf-mirror-gate: all ${verified.length} directory exclusions have HF mirrors`);
}

main().catch((e) => {
  console.error("hf-mirror-gate: unexpected error:", e);
  process.exit(2);
});
