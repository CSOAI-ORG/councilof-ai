#!/usr/bin/env node
/**
 * Review only the claim texts whose source digest moved in a claim-watch receipt.
 * This is a bounded text-presence check, not a finding about truth, motive or quality.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import {
  CURRENT_EXTRACTOR,
  EXTRACTOR_RULE_1,
  extractorFor,
  sha256hex,
} from "../claim-capture.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
};
const receiptPath = arg("receipt");
const repo = resolve(arg("repo") || new URL("../..", import.meta.url).pathname);
const outPath = arg("out");
if (!receiptPath || !outPath) {
  console.error("usage: review_moved_claims.mjs --receipt <receipt.json> --out <review.json> [--repo <root>]");
  process.exit(2);
}
const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
const movedIds = new Set(
  (receipt.observed_changes_requiring_review || [])
    .filter((x) => x.kind === "source_digest_differs_from_the_recorded_read")
    .map((x) => x.claim),
);
function compact(value) {
  return String(value)
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function claimsOf(doc) {
  if (!Array.isArray(doc.claims)) return [];
  return doc.claims.map((c) => ({
    claim_id: c.claim_id,
    subject: c.subject?.name ?? null,
    url: c.source_url,
    claim_verbatim: c.claim_verbatim,
    state: c.state,
    covers: c.source_content_hash?.covers ?? "visible-text",
    extractor:
      (c.source_content_hash?.covers ?? "visible-text") === "visible-text"
        ? (c.source_content_hash?.extractor ?? EXTRACTOR_RULE_1)
        : null,
    recorded_hash: c.source_content_hash?.value ?? null,
  }));
}

const claimsDir = resolve(repo, "public/claims");
const { readdirSync } = await import("node:fs");
const registryDocs = new Map();
const superseded = new Set();
for (const name of readdirSync(claimsDir).filter((n) => /^claimreg-.*\.json$/.test(n) && !n.endsWith(".signed.json"))) {
  try {
    const doc = JSON.parse(readFileSync(resolve(claimsDir, name), "utf8"));
    registryDocs.set(name, doc);
    const prior = doc.supersedes?.file;
    if (prior) superseded.add(String(prior).split("/").at(-1));
  } catch {}
}
const liveRegistries = [...registryDocs.keys()].filter((name) => !superseded.has(name)).sort();
const allClaims = new Map();
for (const name of liveRegistries) {
  const doc = registryDocs.get(name);
  for (const c of claimsOf(doc)) {
    if (movedIds.has(c.claim_id)) {
      if (allClaims.has(c.claim_id)) throw new Error(`duplicate live claim id: ${c.claim_id}`);
      allClaims.set(c.claim_id, { ...c, registry: name });
    }
  }
}
const receiptPrevious = new Map(
  (receipt.observed_changes_requiring_review || [])
    .filter((x) => x.kind === "source_digest_differs_from_the_recorded_read")
    .map((x) => [x.claim, x.detail?.previous_hash ?? null]),
);
for (const [claimId, claim] of allClaims) {
  if (claim.recorded_hash !== receiptPrevious.get(claimId)) {
    throw new Error(
      `${claimId}: live registry hash ${claim.recorded_hash} != watch receipt previous_hash ${receiptPrevious.get(claimId)}`,
    );
  }
}
const cache = new Map();
const UA = "CSOAI-claim-maintenance-text-review/0.1 (+https://councilof.ai/spec/claim-maintenance/v0.2/)";

async function readSource(claim) {
  const key = JSON.stringify([claim.url, claim.covers, claim.extractor]);
  if (cache.has(key)) return cache.get(key);
  let result;
  try {
    const res = await fetch(claim.url, {
      redirect: "follow",
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      result = { http_status: res.status, state: "SOURCE_UNREACHABLE_THIS_REVIEW" };
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      const fn = claim.covers === "visible-text" ? extractorFor(claim.extractor) : null;
      const text = fn ? fn(buf.toString("utf8")) : buf.toString("utf8");
      result = {
        http_status: res.status,
        state: "READ",
        response_bytes: buf.length,
        response_sha256: sha256hex(buf),
        extracted_sha256: sha256hex(Buffer.from(text, "utf8")),
        text,
      };
    }
  } catch (e) {
    result = {
      http_status: null,
      state: "SOURCE_UNREACHABLE_THIS_REVIEW",
      error: String(e).slice(0, 180),
    };
  }
  cache.set(key, result);
  return result;
}
const rows = [];
for (const claimId of [...movedIds].sort()) {
  const claim = allClaims.get(claimId);
  if (!claim) {
    rows.push({ claim_id: claimId, state: "CLAIM_NOT_FOUND_IN_LOCAL_REGISTRIES" });
    continue;
  }
  const source = await readSource(claim);
  if (source.state !== "READ") {
    rows.push({
      ...claim,
      state: source.state,
      http_status: source.http_status,
      error: source.error ?? null,
    });
    continue;
  }
  const exact = source.text.includes(claim.claim_verbatim);
  const normalized = compact(source.text).includes(compact(claim.claim_verbatim));
  rows.push({
    ...claim,
    http_status: source.http_status,
    current_extracted_sha256: source.extracted_sha256,
    claim_text_exact_present: exact,
    claim_text_normalized_present: normalized,
    state: exact
      ? "CLAIM_TEXT_EXACT_PRESENT"
      : normalized
        ? "CLAIM_TEXT_NORMALIZED_PRESENT"
        : "CLAIM_TEXT_NOT_FOUND_CURRENT_READ",
  });
}
const counts = Object.fromEntries(
  [...new Set(rows.map((r) => r.state))].sort().map((state) => [
    state,
    rows.filter((r) => r.state === state).length,
  ]),
);
const output = {
  schema: "csoai.claim-maintenance-text-review/0.1",
  reviewed_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  source_watch_run: receipt.run_id,
  source_watch_receipt_sha256: sha256hex(Buffer.from(readFileSync(receiptPath))),
  moved_claims_requested: movedIds.size,
  moved_claims_reviewed: rows.length,
  unique_source_reads: cache.size,
  counts,
  rows,
  interpretation:
    "Text presence only. EXACT/NORMALIZED_PRESENT means the maintained claim text is still present in the current extracted source while other page bytes moved. NOT_FOUND means the maintained claim text was not found in this read and requires human review. Neither state establishes truth, falsity, motive, endorsement or service quality.",
};
writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ counts, unique_source_reads: cache.size, out: outPath }));
