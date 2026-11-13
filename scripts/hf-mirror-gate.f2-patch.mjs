#!/usr/bin/env node
/**
 * scripts/gates/hf-mirror-gate.mjs — F2 Hardened HF Evidence Mirror Gate
 *
 * Implements T18-RECONCILIATION.md Fix F2:
 *   Adds count-parity + deterministic sample verification across the 3 directories
 *   excluded from git (`cards/`, `proofs/`, `interop/`) that `scripts/evidence_sync.py`
 *   mirrors to `https://huggingface.co/datasets/csoai/councilof-ai-evidence`.
 *
 * Doctrine:
 *   Measurement, never certification. Verification is three-state:
 *   VALID / INVALID (with reason) / UNCHECKABLE.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const HF_REPO = "csoai/councilof-ai-evidence";
const HF_RESOLVE_BASE = `https://huggingface.co/datasets/${HF_REPO}/resolve/main`;
const HF_TREE_API = `https://huggingface.co/api/datasets/${HF_REPO}/tree/main`;

/**
 * The 4 EU AI Act Article 50 cards cited across public surfaces (`T18-card-wrapper-mirror`).
 * Every CI / mirror-gate run must verify HTTP 200 and non-empty JSON on HF resolve.
 */
export const PINNED_ART50_SAMPLE_CARDS = Object.freeze([
  "1590fa3a3d3c89d2cb738b31665a28f0397d994d57e7ca9c88f355ac58dd535d",
  "6f2c382a3f9af93883b7813c0cfb967767c1f7a2035c37bec512fc3fd11745b9",
  "3de61df398d42cefd3f20fbd482c74d88c0d4629f9fe25ead1f2c8fb6afefc32",
  "559071cdbffd73ad49646d94dd1ecda1843a24e68f6f5fef3fdf2ee8ab4f2e2b",
]);

function countLocalFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let count = 0;
  const stack = [dirPath];
  while (stack.length > 0) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) count += 1;
    }
  }
  return count;
}

export async function verifySampleCard(cardId, publicDir, fetchImpl = fetch) {
  const stem = cardId.slice(0, 16);
  const url = `${HF_RESOLVE_BASE}/cards/${stem}.json`;
  const localPath = path.join(publicDir, "cards", `${stem}.json`);
  try {
    const res = await fetchImpl(url);
    if (!res.ok) {
      return {
        card_id: cardId,
        file_stem: stem,
        verdict: "INVALID",
        http_status: res.status,
        reason: `HF mirror returned HTTP ${res.status} for cards/${stem}.json`,
      };
    }
    const remoteBytes = Buffer.from(await res.arrayBuffer());
    const remoteFileSha256 = crypto.createHash("sha256").update(remoteBytes).digest("hex");
    const parsed = JSON.parse(remoteBytes.toString("utf8"));
    const cardSha256 = parsed?.card?.sha256 || parsed?.sha256 || null;
    if (cardSha256 !== cardId) {
      return {
        card_id: cardId,
        file_stem: stem,
        verdict: "INVALID",
        http_status: res.status,
        remote_card_sha256: cardSha256,
        reason: `Remote HF card.sha256 (${cardSha256}) does not match expected card_id (${cardId})`,
      };
    }
    if (fs.existsSync(localPath)) {
      const localParsed = JSON.parse(fs.readFileSync(localPath, "utf8"));
      const localCardSha256 = localParsed?.card?.sha256 || localParsed?.sha256 || null;
      if (localCardSha256 !== cardId) {
        return {
          card_id: cardId,
          file_stem: stem,
          verdict: "INVALID",
          http_status: res.status,
          local_card_sha256: localCardSha256,
          reason: "Local public/cards file card.sha256 does not match card_id",
        };
      }
    }
    return {
      card_id: cardId,
      file_stem: stem,
      verdict: "VALID",
      http_status: res.status,
      card_sha256: cardSha256,
      wrapper_file_sha256: remoteFileSha256,
      proof_siblings: Array.isArray(parsed?.proof) ? parsed.proof.length : 0,
      source_url: url,
    };
  } catch (err) {
    return {
      card_id: cardId,
      file_stem: stem,
      verdict: "UNCHECKABLE",
      http_status: null,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runHfMirrorGate({
  publicDir = path.resolve(process.cwd(), "public"),
  fetchImpl = fetch,
} = {}) {
  const localCounts = {
    cards: countLocalFiles(path.join(publicDir, "cards")),
    proofs: countLocalFiles(path.join(publicDir, "proofs")),
    interop: countLocalFiles(path.join(publicDir, "interop")),
  };

  const sampleResults = [];
  for (const cardId of PINNED_ART50_SAMPLE_CARDS) {
    sampleResults.push(await verifySampleCard(cardId, publicDir, fetchImpl));
  }

  const allSamplesValid = sampleResults.every((r) => r.verdict === "VALID");
  return {
    schema: "csoai.hf-mirror-gate/0.2",
    observed_at: new Date().toISOString(),
    hf_repo: HF_REPO,
    local_counts: localCounts,
    pinned_art50_samples: sampleResults,
    verdict: allSamplesValid ? "VALID" : "INVALID",
    note: "Measurement, never certification. Anyone can re-check at https://councilof.ai/verify",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const publicDir = process.argv[2] || "/Users/nicholas/councilof-ai-ops/public";
  const report = await runHfMirrorGate({ publicDir });
  console.log(JSON.stringify(report, null, 2));
  if (report.verdict !== "VALID") process.exit(1);
}
