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
 * WHY THE THREE STATES. On 2026-11-07T10:35:43Z this gate failed PR #4063 with
 *
 *     ✗ cards: HF mirror MISSING (001e8bd830605eb1.json -> ERROR)
 *     ✗ interop/ots: HF mirror MISSING (_invalid-2026-09-16/README.md -> ERROR)
 *
 * and the remediation it printed was to merge an unrelated PR, because the gate could not
 * tell a MISSING FILE from a FAILED READ. Six minutes later all six probed URLs returned
 * 200. The two "missing" directories were present the whole time: the reads had failed.
 *
 * The read failed because the request was ANONYMOUS. An anonymous request to
 * huggingface.co is rate-limited far more aggressively than an authenticated one -- the
 * estate already learned this with scripts/surface/hub-fetch.mjs, which sends the hub token
 * and retries 429/5xx. This gate did neither, so a rate limit was published as a finding
 * about the files.
 *
 * So the states are now distinct:
 *
 *   VERIFIED     200 / 301 / 302 / 307. The mirror has the file.
 *   MISSING      404. The file is genuinely not there. A REAL FINDING: merging would
 *                create a 302 that lands on a 404.
 *   UNCHECKABLE  anything else -- 429 after the retries, a 5xx, a 403, a timeout, a
 *                network error. The read did not decide. NOT a finding, and not
 *                allowed to be reported as one.
 *
 * A MISSING and an UNCHECKABLE both stop the merge, because the gate must not wave a
 * redirect through on a read it could not complete. They are reported differently, because
 * they need different repairs: one needs the files synced, the other needs the read to
 * succeed.
 *
 * Usage:
 *   node scripts/hf-mirror-gate.mjs                  # check mode (default)
 *   node scripts/hf-mirror-gate.mjs --selftest       # selftest (offline + one live check)
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { hubToken } from "./surface/hub-fetch.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MANIFEST = resolve(ROOT, "scripts/deploy-exclusions.json");
const PUBLIC = resolve(ROOT, "public");
const HF_RESOLVE = "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/";

const VERIFIED_STATUSES = new Set([200, 301, 302, 307]);
const MAX_ATTEMPTS = 3;
const RETRY_STATUSES = (status) => status === 429 || (status >= 500 && status <= 599);

/**
 * The three states. Pure, so it can be tested offline with no network.
 *
 * Only 404 is MISSING. Every other non-verified status is UNCHECKABLE, because the gate
 * cannot tell "the hub says it is not there" from "the hub did not answer".
 */
export function classifyStatus(status) {
  if (VERIFIED_STATUSES.has(status)) return "VERIFIED";
  if (status === 404) return "MISSING";
  return "UNCHECKABLE";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One HEAD request. Returns the HTTP status, or a string for a transport failure.
 * The hub token is sent when one is available, because an anonymous request is
 * rate-limited far more aggressively -- and a rate limit is not an answer.
 */
async function headOnce(url, { fetchImpl = globalThis.fetch, token = null, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { "User-Agent": "csoai-hf-mirror-gate/1.0" };
    if (token && url.startsWith("https://huggingface.co/")) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetchImpl(url, { method: "HEAD", signal: controller.signal, headers });
    return res.status;
  } catch (e) {
    if (e && e.name === "AbortError") return "TIMEOUT";
    return "ERROR";
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Probe one URL, with a bounded retry on the statuses that are genuinely transient
 * (429 and 5xx). A 404 is an ANSWER and is not retried: retrying a real answer is how
 * a gate ends up failing slowly instead of failing honestly.
 *
 * Returns { state, status, attempts, retried }.
 */
export async function probe(url, { fetchImpl = globalThis.fetch, token = null, wait = sleep, attempts = MAX_ATTEMPTS, timeoutMs = 10000 } = {}) {
  let status = "ERROR";
  let used = 0;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    used = attempt;
    status = await headOnce(url, { fetchImpl, token, timeoutMs });
    if (!RETRY_STATUSES(status)) break;
    if (attempt < attempts) await wait(250 * attempt);
  }
  return {
    state: classifyStatus(status),
    status,
    attempts: used,
    retried: used > 1,
  };
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

/** The decision, as a pure function of the probes, so it can be tested offline. */
export function decide(probes) {
  const missing = probes.filter((p) => p.state === "MISSING").map((p) => p.path);
  const uncheckable = probes.filter((p) => p.state === "UNCHECKABLE").map((p) => p.path);
  const verified = probes.filter((p) => p.state === "VERIFIED").map((p) => p.path);
  if (missing.length) return { verdict: "MISSING", missing, uncheckable, verified };
  if (uncheckable.length) return { verdict: "UNCHECKABLE", missing, uncheckable, verified };
  return { verdict: "VERIFIED", missing, uncheckable, verified };
}

async function main() {
  const token = hubToken();

  if (process.argv.includes("--selftest")) {
    // Offline first: the classification is what went wrong, and it must be provable
    // with no network at all.
    const cases = [
      [200, "VERIFIED"], [301, "VERIFIED"], [302, "VERIFIED"], [307, "VERIFIED"],
      [404, "MISSING"], [429, "UNCHECKABLE"], [500, "UNCHECKABLE"], [503, "UNCHECKABLE"],
      [403, "UNCHECKABLE"], ["TIMEOUT", "UNCHECKABLE"], ["ERROR", "UNCHECKABLE"],
    ];
    for (const [status, expected] of cases) {
      const got = classifyStatus(status);
      if (got !== expected) {
        console.error(`✗ selftest FAILED: classifyStatus(${status}) = ${got}, expected ${expected}`);
        process.exit(1);
      }
    }
    console.log(`✓ selftest OK: ${cases.length} status classifications`);

    // Then one live check of a known good path.
    const sampleFile = "proofs/001e8bd830605eb1.json";
    console.log(`hf-mirror-gate: selftest — checking known good path (${sampleFile})`);
    const result = await probe(HF_RESOLVE + sampleFile, { token });
    if (result.state !== "VERIFIED") {
      console.error(`✗ selftest FAILED: ${sampleFile} is ${result.state} (${result.status})`);
      process.exit(1);
    }
    console.log(`✓ selftest OK: ${sampleFile} returned ${result.status}`);
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  // Only check directories that are NOT mirror_only (those are the ones being excluded)
  const dirs = manifest.entries.filter((e) => e.kind === "dir" && !e.mirror_only);

  console.log(`hf-mirror-gate: checking ${dirs.length} directory exclusions against HF mirror`);

  const probes = [];
  let retried = 0;

  for (const entry of dirs) {
    const localDir = resolve(PUBLIC, entry.path);
    const sample = findSampleFile(localDir);

    if (!sample) {
      console.log(`· ${entry.path}: no local files (skipping HF check)`);
      continue;
    }

    const hfUrl = HF_RESOLVE + entry.path + "/" + sample;
    const result = await probe(hfUrl, { token });
    if (result.retried) retried++;
    probes.push({ path: entry.path, url: hfUrl, sample, ...result });

    if (result.state === "VERIFIED") {
      console.log(`✓ ${entry.path}: HF mirror verified (${sample} → ${result.status})`);
    } else if (result.state === "MISSING") {
      console.error(`✗ ${entry.path}: HF mirror MISSING (${sample} → ${result.status})`);
      console.error(`  URL checked: ${hfUrl}`);
    } else {
      console.error(`✗ ${entry.path}: HF mirror UNCHECKABLE (${sample} → ${result.status})`);
      console.error(`  URL checked: ${hfUrl}`);
      console.error(`  The read did not decide. This is NOT a finding that the directory is missing.`);
    }
  }

  console.log();
  if (retried > 0) {
    console.log(`· ${retried} exclusion(s) needed a retry before the hub answered.`);
  }

  const decision = decide(probes);

  if (decision.verdict === "MISSING") {
    console.error(`✗ hf-mirror-gate: ${decision.missing.length} exclusion(s) have no HF mirror:`);
    for (const p of decision.missing) {
      console.error(`    - ${p}`);
    }
    console.error();
    console.error("These directories are in deploy-exclusions.json but not on HF.");
    console.error("Merging would create 302 redirects that land on 404s.");
    console.error();
    console.error("To fix: run the hf-evidence-sync workflow so the files are uploaded to HF.");
    console.error("Then this gate will pass.");
    process.exit(1);
  }

  if (decision.verdict === "UNCHECKABLE") {
    console.error(`✗ hf-mirror-gate: ${decision.uncheckable.length} exclusion(s) could NOT be read:`);
    for (const p of decision.uncheckable) {
      console.error(`    - ${p}`);
    }
    console.error();
    console.error("The mirror was NOT found to be missing. The read itself failed (rate limit,");
    console.error("server error, timeout or network error). The merge is still stopped, because");
    console.error("a redirect must not be waved through on a read that did not complete.");
    console.error();
    console.error("To fix: re-run this gate. If it keeps failing, check huggingface.co rate limits.");
    process.exit(1);
  }

  console.log(`✓ hf-mirror-gate: all ${decision.verified.length} directory exclusions have HF mirrors`);

  // T18 F2: Verify the 4 pinned EU AI Act Article 50 sample card wrappers on HF
  const PINNED_ART50_PREFIXES = [
    "1590fa3a3d3c89d2",
    "6f2c382a3f9af938",
    "3de61df398d42cef",
    "559071cdbffd73ad",
  ];
  for (const prefix of PINNED_ART50_PREFIXES) {
    const cardPath = `cards/${prefix}.json`;
    const result = await probe(HF_RESOLVE + cardPath, { token });
    if (result.state !== "VERIFIED") {
      console.error(`✗ hf-mirror-gate: pinned Article 50 wrapper ${cardPath} is ${result.state} (${result.status})`);
      process.exit(1);
    }
    console.log(`✓ ${cardPath}: pinned Article 50 wrapper verified (${result.status})`);
  }
}

// Only run when this file is the entry point. scripts/surface/hf-mirror-gate.node-test.mjs
// imports classifyStatus, decide and probe from here, and must be able to do that with
// NO network at all -- so importing this module must not start a live check.
const IS_ENTRY_POINT = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (IS_ENTRY_POINT) {
  main().catch((e) => {
    console.error("hf-mirror-gate: unexpected error:", e);
    process.exit(2);
  });
}
