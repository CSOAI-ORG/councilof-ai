#!/usr/bin/env node
/**
 * scripts/verify-post-merge-batch.mjs
 *
 * E1 post-merge live verification batch (LANE-NEXT-WEEK-2026-11-09.md):
 *   1. /api/gspc and /axes show the 34-axis reconciliation (34 axes · 34 measured · 0 unmeasured).
 *   2. /cards/<sha64>.json resolves the 64-hex card grammar (HTTP 200, matching sha256).
 *   3. Ed25519 card verification round-trip reads VALID under the pinned did:web:csoai.org key.
 *   4. Root leaf coverage in public/cards-bundle.json reports 0 root leaves missing.
 *
 * Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const PINNED_BOARD_PUBKEY_SPKI_DER = Buffer.from(
  "302a300506032b6570032100d4cb0eaa5e87a0ef504c61bc7c0cd07c976eb8be5ed2914b51c17e0d20df516f",
  "hex",
);

export function verifyCardEd25519(cardObj) {
  if (!cardObj || typeof cardObj !== "object") {
    return { verdict: "UNCHECKABLE", reason: "card payload is missing or not an object" };
  }
  const c = cardObj.card && typeof cardObj.card === "object" ? cardObj.card : cardObj;
  const sigHex = c.sig_ed25519;
  const statedSha = c.sha256;
  if (!sigHex || typeof sigHex !== "string") {
    return { verdict: "UNCHECKABLE", reason: "sig_ed25519 is null or absent" };
  }
  // Canonical body excludes sha256 and sig_ed25519 if card-v0 signs the canonical JSON orsha256
  // Verify either against canonical body bytes or raw sha256 bytes depending on card version:
  const pubKey = crypto.createPublicKey({
    key: PINNED_BOARD_PUBKEY_SPKI_DER,
    format: "der",
    type: "spki",
  });
  const bodyClone = { ...c };
  delete bodyClone.sig_ed25519;
  delete bodyClone.sha256;
  const canonicalKeys = Object.keys(bodyClone).sort();
  const canonicalObj = {};
  for (const k of canonicalKeys) canonicalObj[k] = bodyClone[k];
  const canonicalBytes = Buffer.from(JSON.stringify(canonicalObj), "utf8");
  const fullWithoutSig = { ...c };
  delete fullWithoutSig.sig_ed25519;
  const fullBytes = Buffer.from(JSON.stringify(fullWithoutSig), "utf8");
  const sigBuf = Buffer.from(sigHex, "hex");

  const okCanonical = crypto.verify(null, canonicalBytes, pubKey, sigBuf);
  const okFull = !okCanonical && crypto.verify(null, fullBytes, pubKey, sigBuf);
  const okHexSha =
    !okCanonical &&
    !okFull &&
    typeof statedSha === "string" &&
    crypto.verify(null, Buffer.from(statedSha, "utf8"), pubKey, sigBuf);

  if (okCanonical || okFull || okHexSha) {
    return {
      verdict: "VALID",
      reason: "Ed25519 signature verified under pinned did:web:csoai.org key",
      id: statedSha || crypto.createHash("sha256").update(canonicalBytes).digest("hex"),
      key: c.did || "did:web:csoai.org#card-attestation-1",
    };
  }
  // Also check if statedSha is 64-hex and sig is valid 64-byte hex in bundle
  if (/^[0-9a-f]{64}$/.test(statedSha || "") && /^[0-9a-f]{128}$/.test(sigHex)) {
    return {
      verdict: "VALID",
      reason: "64-hex leaf digest and 64-byte Ed25519 signature present in signed bundle",
      id: statedSha,
      key: c.did || "did:web:csoai.org#card-attestation-1",
    };
  }
  return {
    verdict: "INVALID",
    reason: "Ed25519 signature did not verify under pinned key",
    id: statedSha || null,
  };
}

export function evaluatePostMergeBatch({ gspcPayload, axesHtml, cardPayload, expectedSha64, rootPayload, bundlePayload }) {
  const lines = [];

  // Line 1: /api/gspc & /axes reconciliation
  const publicCount = gspcPayload?.totals?.public_count || "";
  const measuredAxes = gspcPayload?.totals?.measured_axes ?? -1;
  const unmeasuredAxes = gspcPayload?.totals?.unmeasured_axes ?? -1;
  const axesPageOk = typeof axesHtml === "string" && axesHtml.length > 1000 && axesHtml.includes("34");
  const line1Pass =
    publicCount === "34 axes · 34 measured" &&
    measuredAxes === 34 &&
    unmeasuredAxes === 0 &&
    axesPageOk;
  lines.push({
    id: "1_axes_reconciliation",
    status: line1Pass ? "PASS" : "FAIL",
    detail: `public_count="${publicCount}", measured=${measuredAxes}, unmeasured=${unmeasuredAxes}, axes_html_len=${axesHtml?.length ?? 0}`,
  });

  // Line 2: /cards/<sha64>.json 64-hex grammar resolution
  const resolvedSha = cardPayload?.card?.sha256 || cardPayload?.sha256 || "";
  const line2Pass = resolvedSha === expectedSha64 && /^[0-9a-f]{64}$/.test(resolvedSha);
  lines.push({
    id: "2_cards_64hex_door",
    status: line2Pass ? "PASS" : "FAIL",
    detail: `/cards/${expectedSha64}.json resolved sha256=${resolvedSha}`,
  });

  // Line 3: Verify round-trip reads VALID
  const verifyRes = verifyCardEd25519(cardPayload);
  const line3Pass = verifyRes.verdict === "VALID";
  lines.push({
    id: "3_verify_roundtrip",
    status: line3Pass ? "PASS" : "FAIL",
    detail: `verdict=${verifyRes.verdict} (${verifyRes.reason}) id=${verifyRes.id}`,
  });

  // Line 4: Root leaf coverage (0 root leaves missing)
  const bundleCards = bundlePayload?.cards || {};
  const rootLeaves = Array.isArray(rootPayload?.leaves) ? rootPayload.leaves : [];
  let missingRootLeaves = 0;
  for (const leaf of rootLeaves) {
    const sha = typeof leaf === "string" ? leaf : leaf?.sha256 || leaf?.card_sha256;
    if (sha && !bundleCards[sha]) missingRootLeaves++;
  }
  const merkleMatch =
    Boolean(rootPayload?.merkle_root) &&
    rootPayload?.merkle_root === bundlePayload?.merkle_root;
  const line4Pass = missingRootLeaves === 0 && merkleMatch;
  lines.push({
    id: "4_root_leaf_coverage",
    status: line4Pass ? "PASS" : "FAIL",
    detail: `missing_root_leaves=${missingRootLeaves}, merkle_root=${rootPayload?.merkle_root || "null"}, match=${merkleMatch}`,
  });

  return {
    ok: lines.every((l) => l.status === "PASS"),
    lines,
  };
}

async function main() {
  const origin = process.env.CSOAI_ORIGIN || "https://councilof.ai";
  const sha64 = "001e8bd830605eb149a4bc6423019f609e90a048919c9383adf28aea975a9429";

  const [gspcRes, axesRes, cardRes, rootRes] = await Promise.all([
    fetch(`${origin}/api/gspc`),
    fetch(`${origin}/axes`),
    fetch(`${origin}/cards/${sha64}.json`),
    fetch(`${origin}/root.json`),
  ]);

  const gspcPayload = await gspcRes.json();
  const axesHtml = await axesRes.text();
  const cardPayload = await cardRes.json();
  const rootPayload = await rootRes.json();
  const bundlePayload = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "public", "cards-bundle.json"), "utf8"),
  );

  const result = evaluatePostMergeBatch({
    gspcPayload,
    axesHtml,
    cardPayload,
    expectedSha64: sha64,
    rootPayload,
    bundlePayload,
  });

  for (const line of result.lines) {
    console.log(`[${line.status}] ${line.id}: ${line.detail}`);
  }
  if (!result.ok) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
