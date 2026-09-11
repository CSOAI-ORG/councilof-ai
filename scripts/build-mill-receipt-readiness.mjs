#!/usr/bin/env node
/** Derive lifecycle and regulatory readiness without altering signed card bytes. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyCard } from "../public/signed/verify-card.mjs";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDir = path.join(repo, "public/interop/mill-cards-signed");
const output = path.join(repo, "public/interop/mill-receipt-readiness.json");
const files = fs.readdirSync(sourceDir).filter((name) => name.endsWith(".json")).sort();
const cardsById = new Map();
for (const file of files) {
  const card = JSON.parse(fs.readFileSync(path.join(sourceDir, file), "utf8"));
  if (typeof card?.id === "string") cardsById.set(card.id, { card, file });
}
const replacements = new Map();
const ledger = path.join(sourceDir, "SUPERSEDED.jsonl");
if (fs.existsSync(ledger)) {
  for (const line of fs.readFileSync(ledger, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (typeof row.superseded_id === "string" && typeof row.by_id === "string") {
      replacements.set(row.superseded_id, row.by_id);
    }
  }
}
const rows = [];

for (const file of files) {
  const original = JSON.parse(fs.readFileSync(path.join(sourceDir, file), "utf8"));
  if (original?.body?.signature_state !== "STAGED_UNSIGNED") continue;
  let currentId = original.id;
  const seen = new Set();
  while (replacements.has(currentId)) {
    if (seen.has(currentId)) throw new Error(`supersession cycle at ${currentId}`);
    seen.add(currentId);
    currentId = replacements.get(currentId);
  }
  const current = cardsById.get(currentId);
  if (!current) throw new Error(`missing terminal replacement ${currentId} for ${original.id}`);
  const { card, file: currentFile } = current;
  const verdict = await verifyCard(card);
  const rawLinkage = card.body?.regulatory_crosswalk?.linkage_status ?? "UNLINKED";
  const linkage = rawLinkage === "DIRECT" ? "LINKED" : "UNLINKED";
  rows.push({
    id: card.id,
    card_url: `/interop/mill-cards-signed/${currentFile}`,
    supersedes_staged_id: original.id,
    model: card.body.model,
    axis: card.body.axis,
    measured_at: card.body.measured_at ?? null,
    outer_signature: { state: verdict.state, alg: card.alg ?? null, key: card.did ?? null },
    declared_lifecycle: card.body.signature_state,
    regulatory_linkage: {
      state: linkage,
      source_state: rawLinkage,
      refs: card.body?.regulatory_crosswalk?.refs ?? [],
      regulation_score_eligible: linkage === "LINKED",
    },
  });
}

const counts = {
  receipts: rows.length,
  outer_signature_valid: rows.filter((row) => row.outer_signature.state === "VALID").length,
  declared_staged_unsigned: rows.filter((row) => row.declared_lifecycle === "STAGED_UNSIGNED").length,
  declared_signed: rows.filter((row) => row.declared_lifecycle === "SIGNED").length,
  regulatory_linked: rows.filter((row) => row.regulatory_linkage.state === "LINKED").length,
  regulatory_unlinked: rows.filter((row) => row.regulatory_linkage.state === "UNLINKED").length,
  regulation_score_eligible: rows.filter((row) => row.regulatory_linkage.regulation_score_eligible).length,
};

if (counts.receipts !== 36 || counts.outer_signature_valid !== 36 ||
    counts.declared_staged_unsigned !== 0 || counts.declared_signed !== 36 || counts.regulatory_linked !== 5 ||
    counts.regulatory_unlinked !== 31 || counts.regulation_score_eligible !== 5) {
  throw new Error(`mill receipt truth drift: ${JSON.stringify(counts)}`);
}

const document = {
  schema: "csoai.mill-receipt-readiness/v2",
  derived_from: "the 36 original STAGED_UNSIGNED wrappers resolved through public/interop/mill-cards-signed/SUPERSEDED.jsonl to their terminal immutable replacements",
  truth_rule: "Outer cryptographic validity, inner declared lifecycle, and regulatory linkage are independent states. UNLINKED receipts are not regulation-scored.",
  counts,
  receipts: rows,
};
const rendered = JSON.stringify(document, null, 2) + "\n";
if (process.argv.includes("--check")) {
  const current = fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "";
  if (current !== rendered) throw new Error("mill receipt readiness is stale; run build-mill-receipt-readiness.mjs");
  console.log(`mill receipt readiness PASS: ${counts.outer_signature_valid}/36 outer VALID; ${counts.declared_signed}/36 lifecycle SIGNED; ${counts.regulatory_linked} linked; ${counts.regulatory_unlinked} unlinked`);
} else {
  fs.writeFileSync(output, rendered);
  console.log(`wrote ${path.relative(repo, output)}`);
}
