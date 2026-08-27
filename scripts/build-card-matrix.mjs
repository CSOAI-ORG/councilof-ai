#!/usr/bin/env node
/**
 * build-card-matrix.mjs — derive a browsable index of the signed card corpus.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────
 * public/signed/cards/ holds one signed card per measured cell: one model, on
 * one axis, on one date, with an Ed25519 signature over the card's own body.
 * Every one of those cells is real, verified work — and no surface on the site
 * exposed it, because reading it meant fetching every card file one by one.
 * A browser cannot do that, so the matrix is derived once, here, at build time.
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
 * 4. A MODEL NAME THAT MAY NOT BE PUBLISHED IS NOT PUBLISHED — and its absence
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

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARDS = path.join(REPO, "public", "signed", "cards");
const OUT = path.join(REPO, "public", "signed", "card-matrix.json");

// The same display-name policy the deploy gate enforces on rendered pages. Kept
// here so the derived artifact never has to be hand-patched after the fact.
const UNPUBLISHABLE_NAME =
  /\bsovereign\b|\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b|\bceasai|\bbyzantine\b|\bBFT\b|crown[\s-]?jewels?|goldmines|black swans|\bOWEM\b|\bSIGIL\b/i;

if (!fs.existsSync(CARDS)) {
  console.error(`build-card-matrix: no card directory at ${path.relative(REPO, CARDS)}`);
  process.exit(2);
}

const files = fs.readdirSync(CARDS).filter((f) => f.endsWith(".json")).sort();

const cells = [];
const skipped = [];
for (const f of files) {
  let card;
  try {
    card = JSON.parse(fs.readFileSync(path.join(CARDS, f), "utf8"));
  } catch (e) {
    skipped.push({ file: f, why: "unreadable JSON" });
    continue;
  }
  const b = card.body ?? {};
  // A card with no model or no axis names no cell. It is recorded as skipped
  // rather than coerced into one — an invented key would be a fabricated cell.
  if (typeof b.model !== "string" || typeof b.axis !== "string") {
    skipped.push({ file: f, why: "card body names no model/axis pair" });
    continue;
  }
  cells.push({
    model: b.model,
    axis: b.axis,
    accuracy: typeof b.accuracy === "number" ? b.accuracy : null,
    created: typeof b.created === "string" ? b.created : null,
    card: card.id ?? path.basename(f, ".json"),
    card_url: `/signed/cards/${card.id ?? path.basename(f, ".json")}.json`,
    signed: typeof card.signature === "string" && card.signature.length > 0,
    alg: card.alg ?? null,
    pubkey: card.pubkey ?? null,
  });
}

// ── model keys, with the display-name policy applied ─────────────────────────
const rawModels = [...new Set(cells.map((c) => c.model))].sort();
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

const publicCells = cells.map((c) => {
  const key = modelKey.get(c.model);
  const { model, ...rest } = c;
  return { model: key, ...rest };
});

const axisIds = [...new Set(publicCells.map((c) => c.axis))].sort();
const modelIds = [...new Set(publicCells.map((c) => c.model))].sort();

const axes = axisIds.map((id) => {
  const own = publicCells.filter((c) => c.axis === id);
  return {
    id,
    cards: own.length,
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
    axes: [...new Set(own.map((c) => c.axis))].sort(),
    mean_accuracy: mean(own.map((c) => c.accuracy)),
    best_accuracy: own.length ? Math.max(...own.map((c) => c.accuracy ?? 0)) : null,
    as_of: newest(own.map((c) => c.created)),
  };
});

const body = {
  schema: "csoai.card-matrix/1",
  title: "The signed card corpus, indexed — one card per model-and-axis cell",
  derived_from: "public/signed/cards/*.json",
  derivation:
    "Every count below is the length of an array built by reading those files. Nothing here is " +
    "typed by hand, and re-running the generator on an unchanged corpus writes identical bytes.",
  as_of: newest(publicCells.map((c) => c.created)),
  as_of_field: "the newest body.created stamp across the cards — when the last card was measured, never when this file was generated",
  not_the_board:
    "THESE ARE NOT THE PUBLIC BOARD'S AXES. The cards carry benchmark axes; the public board carries " +
    "governance axes measured by a different instrument. The two sets are different, their counts are " +
    "different on purpose, and they are never added together. The board's count authority is GET /api/gspc.",
  what_a_cell_is:
    "One model measured on one axis on one date, recorded in a card whose signature covers its own body. " +
    "An empty cell means that pair was never measured — it is not a zero.",
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
    signed_cells: publicCells.filter((c) => c.signed).length,
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
};

const json = JSON.stringify(body, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== json) {
    console.error("✗ card-matrix: public/signed/card-matrix.json is stale — run node scripts/build-card-matrix.mjs");
    process.exit(1);
  }
  console.log(`✓ card-matrix: up to date (${body.counts.cells} cells, ${body.counts.models} models, ${body.counts.axes} axes)`);
  process.exit(0);
}

fs.writeFileSync(OUT, json);
console.log(
  `✓ card-matrix: ${body.counts.cells} cells · ${body.counts.models} models · ${body.counts.axes} axes ` +
    `· ${body.counts.signed_cells} signed · ${body.counts.skipped_cards} skipped → ${path.relative(REPO, OUT)}`,
);
