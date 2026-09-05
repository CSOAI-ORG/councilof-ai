#!/usr/bin/env node
/**
 * build-card-matrix.mjs — derive a browsable index of the signed card corpus.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────
 * The estate has two card generations: public/signed/cards/ and the newer mill
 * output in public/interop/mill-cards-signed/. A browser cannot safely fetch and
 * verify every file, so the matrix is derived once, here, at build time.
 *
 * ── THE RULES THIS FILE KEEPS ────────────────────────────────────────────────
 * 1. NOTHING IS TYPED. Every count in the output is the length of an array read
 *    off disk. Change the cards and the output changes; there is no integer in
 *    this file standing in for a count.
 * 2. NO `new Date()`. `as_of` is the newest `created` stamp found ACROSS THE
 *    CARDS — a date that says when something was measured, never when this
 *    script ran. Re-running it on an unchanged corpus writes identical bytes.
 * 3. THE CARD AXES ARE NOT THE BOARD AXES. The cards carry benchmark axes; the
 *    public board carries governance axes. They are different sets and are never
 *    added together. The output says so, in the file, so a machine reading it
 *    cannot make that mistake either.
 * 4. SIGNED IS NOT ADMITTED. A card enters `cells` only after its canonical body
 *    verifies under a pinned GSPC key AND its independent measurement admission
 *    verifies under a separately configured adjudicator key. Historical cards
 *    remain visible under `non_quotable_records`; they are never silently lost
 *    or exposed to consumers that still treat every `cells` row as measured.
 * 5. A MODEL NAME THAT MAY NOT BE PUBLISHED IS NOT PUBLISHED — and its absence
 *    is declared rather than silently dropped. The card bytes still carry the
 *    original name, under the signature, where it belongs; the browsable index
 *    carries a neutral label and says one name is withheld and why. Dropping the
 *    model entirely would hide measured work; printing the name would ship a
 *    retired internal brand. Neither is acceptable, so it does both halves
 *    honestly.
 *
 *   node scripts/build-card-matrix.mjs           # writes public/signed/card-matrix.json
 *   node scripts/build-card-matrix.mjs --check   # fails if the file on disk is stale
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultProfile } from "../packages/gspc-card-verifier/src/index.mjs";
import {
  EVIDENCE_STATES,
  admissionKeysFromEnvironment,
  classifyCardEvidence,
} from "./card-evidence-trust.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(REPO, "public", "signed", "card-matrix.json");
const SOURCES = [
  {
    id: "legacy-card-corpus",
    directory: path.join(REPO, "public", "signed", "cards"),
    urlPrefix: "/signed/cards",
    required: true,
  },
  {
    id: "mill-card-corpus",
    directory: path.join(REPO, "public", "interop", "mill-cards-signed"),
    urlPrefix: "/interop/mill-cards-signed",
    required: false,
  },
];

// The same display-name policy the deploy gate enforces on rendered pages. Kept
// here so the derived artifact never has to be hand-patched after the fact.
const UNPUBLISHABLE_NAME =
  /\bsovereign\b|\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b|\bceasai|\bbyzantine\b|\bBFT\b|crown[\s-]?jewels?|goldmines|black swans|\bOWEM\b|\bSIGIL\b/i;
const verdictSummary = (verdict) =>
  verdict ? { state: verdict.state, code: verdict.code } : null;

for (const source of SOURCES.filter((item) => item.required)) {
  if (!fs.existsSync(source.directory)) {
    console.error(`build-card-matrix: no card directory at ${path.relative(REPO, source.directory)}`);
    process.exit(2);
  }
}

const profile = defaultProfile();
let allowedAdmissionKeys;
try {
  allowedAdmissionKeys = {
    ...(profile.pinnedAdmissionKeys ?? {}),
    ...admissionKeysFromEnvironment(),
  };
} catch (error) {
  console.error(`build-card-matrix: invalid adjudicator pin configuration: ${error.message}`);
  process.exit(2);
}

const files = SOURCES.flatMap((source) =>
  fs.existsSync(source.directory)
    ? fs
        .readdirSync(source.directory)
        .filter((file) => file.endsWith(".json"))
        .sort()
        .map((file) => ({ source, file }))
    : [],
);

const records = [];
const skipped = [];
for (const { source, file } of files) {
  let card;
  try {
    card = JSON.parse(fs.readFileSync(path.join(source.directory, file), "utf8"));
  } catch (e) {
    skipped.push({ source: source.id, file, why: "unreadable JSON" });
    continue;
  }
  const b = card.body ?? {};
  // A card with no model or no axis names no cell. It is recorded as skipped
  // rather than coerced into one — an invented key would be a fabricated cell.
  if (typeof b.model !== "string" || typeof b.axis !== "string") {
    skipped.push({ source: source.id, file, why: "card body names no model/axis pair" });
    continue;
  }
  const trust = await classifyCardEvidence(card, { profile, allowedAdmissionKeys });
  records.push({
    model: b.model,
    axis: b.axis,
    // Never copy a score into the consumable matrix until both independent
    // verification paths pass. The original signed bytes remain at card_url.
    accuracy: trust.quotable && typeof b.accuracy === "number" ? b.accuracy : null,
    recorded_accuracy_in_card: typeof b.accuracy === "number",
    created:
      typeof b.created === "string"
        ? b.created
        : trust.admitted && typeof card.admission?.admitted_at === "string"
          ? card.admission.admitted_at
          : null,
    card: typeof card.id === "string" ? card.id : path.basename(file, ".json"),
    card_url: `${source.urlPrefix}/${file}`,
    source: source.id,
    evidence_state: trust.state,
    signature_verified: trust.signatureVerified,
    admitted: trust.admitted,
    quotable: trust.quotable,
    // Backward-compatible field, deliberately strengthened: old consumers that
    // gate only on `signed` now fail closed rather than quoting legacy evidence.
    signed: trust.quotable,
    alg: card.alg ?? null,
    pubkey: card.pubkey ?? null,
    did: card.did ?? null,
    verification: {
      card: verdictSummary(trust.cardVerification),
      signer_authorization: verdictSummary(trust.signerAuthorization),
      admission: verdictSummary(trust.admissionVerification),
    },
  });
}

// ── model keys, with the display-name policy applied ─────────────────────────
const rawModels = [...new Set(records.map((c) => c.model))].sort();
const withheld = rawModels.filter((m) => UNPUBLISHABLE_NAME.test(m));
const modelKey = new Map();
let n = 0;
for (const m of rawModels) {
  modelKey.set(m, UNPUBLISHABLE_NAME.test(m) ? `withheld-name-${++n}` : m);
}

const mean = (xs) => {
  const v = xs.filter((x) => typeof x === "number");
  return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10000) / 10000 : null;
};
const newest = (xs) => {
  const v = xs.filter(Boolean).sort();
  return v.length ? v[v.length - 1] : null;
};

const publicRecords = records.map((c) => {
  const key = modelKey.get(c.model);
  const { model, ...rest } = c;
  return { model: key, ...rest };
});
const publicCells = publicRecords.filter((record) => record.quotable);
const nonQuotableRecords = publicRecords.filter((record) => !record.quotable);

const axisIds = [...new Set(publicCells.map((c) => c.axis))].sort();
const modelIds = [...new Set(publicCells.map((c) => c.model))].sort();

const axes = axisIds.map((id) => {
  const own = publicCells.filter((c) => c.axis === id);
  return {
    id,
    cards: own.length,
    quotable_cards: own.length,
    models: new Set(own.map((c) => c.model)).size,
    mean_accuracy: mean(own.map((c) => c.accuracy)),
    best_accuracy: own.length ? Math.max(...own.map((c) => c.accuracy ?? 0)) : null,
    as_of: newest(own.map((c) => c.created)),
  };
});

const models = modelIds.map((id) => {
  const own = publicCells.filter((c) => c.model === id);
  return {
    id,
    name_published: !id.startsWith("withheld-name-"),
    cards: own.length,
    quotable_cards: own.length,
    axes: [...new Set(own.map((c) => c.axis))].sort(),
    mean_accuracy: mean(own.map((c) => c.accuracy)),
    best_accuracy: own.length ? Math.max(...own.map((c) => c.accuracy ?? 0)) : null,
    as_of: newest(own.map((c) => c.created)),
  };
});

const body = {
  schema: "csoai.card-matrix/2",
  title: "The admitted card corpus, with non-quotable signed inventory retained",
  derived_from: SOURCES.map((source) => `${path.relative(REPO, source.directory)}/*.json`),
  derivation:
    "Every source card is cryptographically verified under a pinned GSPC key. A card enters cells " +
    "only when its separate csoai.measurement-admission/0.1 signature also verifies under an " +
    "independently configured adjudicator key. Historical records remain in non_quotable_records.",
  as_of: newest(publicCells.map((c) => c.created)),
  as_of_field: "the newest body.created stamp among admitted, verified, quotable cards — never when this file was generated",
  inventory_as_of: newest(publicRecords.map((c) => c.created)),
  not_the_board:
    "THESE ARE NOT THE PUBLIC BOARD'S AXES. The cards carry benchmark axes; the public board carries " +
    "governance axes measured by a different instrument. The two sets are different, their counts are " +
    "different on purpose, and they are never added together. The board's count authority is GET /api/gspc.",
  what_a_cell_is:
    "One model measured on one axis on one date, with both a verified card signature and a verified, " +
    "independent measurement admission. Historical signed cards without admission are retained outside " +
    "cells and cannot become a score, ranking or finding. An empty cell is not a zero.",
  what_this_does_not_establish:
    "That a model is good, or better than another. A cell is one score on one small bank on one date. " +
    "Several of these banks are small enough that a single item moves the number visibly, most cells in " +
    "the matrix are empty, and a score of zero is a measured zero rather than a missing measurement.",
  display_name_policy: {
    rule:
      "A model whose recorded name carries a retired internal brand is indexed under a neutral key. Its " +
      "measured work is kept and counted; only the label is withheld.",
    withheld_names: withheld.length,
    where_the_name_still_lives:
      "In the card's own body, under the signature. The card is the evidence and it was not edited — " +
      "editing it would invalidate every id downstream of it.",
  },
  counts: {
    cards_read: files.length,
    cells: publicCells.length,
    models: models.length,
    axes: axes.length,
    signed_cells: publicCells.length,
    admitted_cells: publicCells.length,
    quotable_cells: publicCells.length,
    signature_verified_records: publicRecords.filter((c) => c.signature_verified).length,
    legacy_unadjudicated_records: publicRecords.filter(
      (c) => c.evidence_state === EVIDENCE_STATES.LEGACY_UNADJUDICATED,
    ).length,
    unverified_records: publicRecords.filter(
      (c) => c.evidence_state === EVIDENCE_STATES.UNVERIFIED,
    ).length,
    non_quotable_records: nonQuotableRecords.length,
    inventory_models: new Set(publicRecords.map((c) => c.model)).size,
    inventory_axes: new Set(publicRecords.map((c) => c.axis)).size,
    possible_cells: models.length * axes.length,
    skipped_cards: skipped.length,
    coverage_note:
      "cells out of possible_cells. Most pairs were never measured, and the empty ones are the honest " +
      "part of the picture — they are shown, not hidden.",
  },
  skipped,
  axes,
  models,
  cells: publicCells,
  non_quotable_records: nonQuotableRecords,
};

const json = JSON.stringify(body, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== json) {
    console.error("✗ card-matrix: public/signed/card-matrix.json is stale — run node scripts/build-card-matrix.mjs");
    process.exit(1);
  }
  console.log(
    `✓ card-matrix: up to date (${body.counts.quotable_cells} quotable, ` +
      `${body.counts.legacy_unadjudicated_records} legacy unadjudicated, ` +
      `${body.counts.unverified_records} unverified)`,
  );
  process.exit(0);
}

fs.writeFileSync(OUT, json);
console.log(
  `✓ card-matrix: ${body.counts.quotable_cells} admitted+verified cells · ` +
    `${body.counts.legacy_unadjudicated_records} legacy unadjudicated · ` +
    `${body.counts.unverified_records} unverified · ${body.counts.skipped_cards} skipped → ${path.relative(REPO, OUT)}`,
);
