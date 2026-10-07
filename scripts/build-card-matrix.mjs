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
 * 5. OUR OWN MODELS ARE LABELLED, NEVER RANKED AMONG THIRD-PARTY ONES. Each model row
 *    carries `kind` ("third_party" | "own" | "own_unconfirmed"), classified from the RAW
 *    card name before the withheld-name mapping, so a withheld-name-N row is still "own"
 *    and no internal name is emitted. counts.models stays the whole corpus (consumers read
 *    it); the per-kind counts sit beside it.
 * 6. A ZERO IS QUOTED ONLY WHERE OTHER MODELS BEAT IT ON THE SAME BANK. A cell is flagged
 *    `zero_flag: "AXIS_FLOOR"` when every model on its axis scored exactly 0, and
 *    `"MODEL_FLOOR"` when its model scored exactly 0 on every axis it has while another
 *    model scored above 0 on at least one of them. Flagged cells are kept (they are signed
 *    evidence) but left out of mean_accuracy / best_accuracy and counted under
 *    counts.zero_not_quotable. The cards carry no item count and no raw answers, so the
 *    cause cannot be checked from the card.
 * 7. AN AXIS'S AVERAGE AND BEST ARE THIRD-PARTY FIGURES. axes[].mean_accuracy and
 *    axes[].best_accuracy are taken over third-party models only (null when none was
 *    measured on the axis); our own rows never set or join an axis figure. axes[].models
 *    still counts every model; models_third_party / models_own split it.
 *
 *   node scripts/build-card-matrix.mjs           # writes public/signed/card-matrix.json
 *   node scripts/build-card-matrix.mjs --check   # fails if the file on disk is stale
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Own-model classification: the exact rules scripts/build-own-model-disclosure.mjs publishes
// (R1 sov*/clan*, R2 council*, and its UNCONFIRMED_TAGS list), imported rather than copied, the
// same import scripts/build-models-measured.mjs uses. Not /api/gspc's council-only test.
import { isR1, isR2, UNCONFIRMED_TAGS } from "./build-own-model-disclosure.mjs";

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

// ── ownership, classified on the RAW name, carried by the public key ─────────
// The withheld keys are neutral on purpose. Persona sweep 6 Oct 2026 (T15): /board/models
// printed counts.models as "Models measured", counting our own tags in.
function modelKind(raw) {
  if (isR1(raw) || isR2(raw)) return "own";
  if (UNCONFIRMED_TAGS.includes(raw)) return "own_unconfirmed";
  return "third_party";
}
const kindByKey = new Map();
for (const m of rawModels) kindByKey.set(modelKey.get(m), modelKind(m));

const mean = (xs) => {
  const v = xs.filter((x) => typeof x === "number");
  return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10000) / 10000 : null;
};
const newest = (xs) => {
  const v = xs.filter(Boolean).sort();
  return v.length ? v[v.length - 1] : null;
};

const publicCells0 = cells.map((c) => {
  const key = modelKey.get(c.model);
  const { model, ...rest } = c;
  return { model: key, ...rest };
});

// ── zeros that point at the scoring, not the model ───────────────────────────
const isZero = (c) => c.accuracy === 0;
const axisFloor = new Set(
  [...new Set(publicCells0.map((c) => c.axis))].filter((ax) => {
    const own = publicCells0.filter((c) => c.axis === ax);
    return own.length > 0 && own.every(isZero);
  }),
);
const modelFloor = new Set(
  [...new Set(publicCells0.map((c) => c.model))].filter((m) => {
    const mine = publicCells0.filter((c) => c.model === m);
    if (!mine.length || !mine.every(isZero)) return false;
    const myAxes = new Set(mine.map((c) => c.axis));
    return publicCells0.some((c) => c.model !== m && myAxes.has(c.axis) && typeof c.accuracy === "number" && c.accuracy > 0);
  }),
);
const zeroFlag = (c) => (axisFloor.has(c.axis) ? "AXIS_FLOOR" : modelFloor.has(c.model) ? "MODEL_FLOOR" : null);
const publicCells = publicCells0.map((c) => {
  const flag = zeroFlag(c);
  return flag ? { ...c, zero_flag: flag } : c;
});
const quotable = (xs) => xs.filter((c) => !c.zero_flag);
const best = (xs) => {
  const v = quotable(xs).map((c) => c.accuracy).filter((x) => typeof x === "number");
  return v.length ? Math.max(...v) : null;
};

const axisIds = [...new Set(publicCells.map((c) => c.axis))].sort();
const modelIds = [...new Set(publicCells.map((c) => c.model))].sort();

// Rule 7: an axis's average and best are figures about third-party models only. Before
// 6 Oct 2026 they were taken over every model on the axis, so the Council OS Leaderboard
// headed each column "best 100.0%" with one of our own overlays in the top cell.
const isThirdParty = (c) => kindByKey.get(c.model) === "third_party";
const axes = axisIds.map((id) => {
  const own = publicCells.filter((c) => c.axis === id);
  const third = own.filter(isThirdParty);
  return {
    id,
    cards: own.length,
    models: new Set(own.map((c) => c.model)).size,
    models_third_party: new Set(third.map((c) => c.model)).size,
    models_own: new Set(own.filter((c) => !isThirdParty(c)).map((c) => c.model)).size,
    mean_accuracy: mean(quotable(third).map((c) => c.accuracy)),
    best_accuracy: best(third),
    zero_not_quotable: own.filter((c) => c.zero_flag).length,
    as_of: newest(own.map((c) => c.created)),
  };
});

const models = modelIds.map((id) => {
  const own = publicCells.filter((c) => c.model === id);
  return {
    id,
    kind: kindByKey.get(id),
    name_published: !id.startsWith("withheld-name-"),
    cards: own.length,
    axes: [...new Set(own.map((c) => c.axis))].sort(),
    mean_accuracy: mean(quotable(own).map((c) => c.accuracy)),
    best_accuracy: best(own),
    zero_not_quotable: own.filter((c) => c.zero_flag).length,
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
    "Several of these banks are small enough that a single item moves the number visibly, and most cells in " +
    "the matrix are empty. A zero is quoted only where other models scored above zero on the same bank. " +
    "Where every model scored exactly zero on a bank, or one model scored exactly zero on every bank, the " +
    "zero points at the scoring rather than the model, and it is shown as not quotable. These cards record " +
    "accuracy only, with no item count and no raw answers, so the cause cannot be checked from the card.",
  zero_flag_rule: {
    AXIS_FLOOR: "every model on this cell's axis scored exactly 0",
    MODEL_FLOOR: "this cell's model scored exactly 0 on every axis it has, while another model scored above 0 on at least one of them",
    effect: "flagged cells stay in cells[] (they are signed evidence) but are left out of mean_accuracy and best_accuracy, and are counted under counts.zero_not_quotable",
  },
  own_model_rule: "scripts/build-own-model-disclosure.mjs R1 (sov*, clan*), R2 (council*) and UNCONFIRMED_TAGS, imported",
  kind_note:
    "models[].kind is third_party, own (our own prompt overlays and specialists, classified on the raw card name before " +
    "any name is withheld) or own_unconfirmed (names that suggest a model we derived; the owner has not confirmed them). " +
    "Our own models are listed apart and never compared with third-party ones.",
  axis_stats_rule:
    "axes[].mean_accuracy and axes[].best_accuracy are computed over third-party models only (kind third_party), " +
    "and are null where no third-party model was measured on the axis. Our own models (own, own_unconfirmed) never " +
    "set or join an axis average or best. axes[].models counts every model on the axis; models_third_party and " +
    "models_own split it.",
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
    models_third_party: models.filter((m) => m.kind === "third_party").length,
    models_own: models.filter((m) => m.kind === "own").length,
    models_own_unconfirmed: models.filter((m) => m.kind === "own_unconfirmed").length,
    cells_third_party: publicCells.filter((c) => kindByKey.get(c.model) === "third_party").length,
    zero_not_quotable: publicCells.filter((c) => c.zero_flag).length,
    axes: axes.length,
    signed_cells: publicCells.filter((c) => c.signed).length,
    possible_cells: models.length * axes.length,
    skipped_cards: skipped.length,
    coverage_note:
      "cells out of possible_cells. Most pairs were never measured, and the empty ones are the honest " +
      "part of the picture — they are shown, not hidden.",
  },
  models_split_rule:
    "counts.models_own = R1 (name starts sov/clan) or R2 (starts with the word council, or carries " +
    "(council specialist)); counts.models_own_unconfirmed = the owner-unconfirmed tags; " +
    "counts.models_third_party = everything else. Same rule as /independence/own-model-disclosure.json. " +
    "The three add up to counts.models.",
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
