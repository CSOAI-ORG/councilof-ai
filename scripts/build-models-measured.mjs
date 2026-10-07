#!/usr/bin/env node
// build-models-measured.mjs: how many distinct AI models we have measured on frozen banks, and which.
//
// Read by the home page (the "models measured" figure) and by /models-measured/ (the list). Every
// count in the output is derived here from the bytes of two signed corpora. No count is typed
// anywhere, in this file or in the pages that read it.
//
// WHY THIS EXISTS (owner, 30 Sep 2026). The home page printed "model fleets tested 14". That figure
// is totals.model_fleets off /api/gspc, which counts MODEL-COMPARISON AXES (one fleet per axis), not
// models. Read as a model count it understated the work by an order of magnitude. The axis count
// stays on the board, under its own name; this file is the model count, under its own name.
//
// SOURCES (both committed, both signed; nothing is fetched):
//   A. The signed card index, public/signed/card_index.json -> public/signed/cards/*.json
//      (corpus 3 of three; council-os/CARD-CORPORA.md). Every card body names body.model.
//   B. The OIDC-signed mill cards, public/interop/mill-cards-signed/signed-*.json. A mill card counts
//      only if ALL of: its Ed25519 signature VERIFIES here under the did:web:csoai.org key it names
//      (public/.well-known/did.json) and its id recomputes, body.status === "MEASURED",
//      quotable === true, n >= 30, the body does not say STAGED_UNSIGNED, and its id is in neither
//      WITHDRAWN.jsonl nor SUPERSEDED.jsonl. (README there: "MEASURED only after verify VALID. n<30
//      unquotable.") Cards that also carry an admission receipt are flagged per model.
//   The board's own per-item fleet (measured_on on /api/gspc: 6 base models) is inside A already.
//
// IDENTITY. A model is the identifier the card records, with only the runtime wrapper removed: an
// "ollama:" or "t4:" route prefix and an "@sha256:..." digest suffix. Nothing else is merged. An
// Ollama tag (a quantised GGUF build) and a Hugging Face repo are different weights and are counted
// as different models even when they share a base; the list says so beside the figure.
//
// KINDS. Our own models are classified by the exact rules of scripts/build-own-model-disclosure.mjs
// (R1 sov*/clan*, R2 council*, plus its UNCONFIRMED list), imported, not copied. They are counted
// separately and NEVER added to the third-party figure: they are prompt overlays on stock weights
// (C-2026-0930-11) and a neutral body does not quote itself. Deterministic fact runs (servers,
// endpoints, public records) have no model and are not in this file at all.
//
//   node scripts/build-models-measured.mjs          write public/interop/models-measured.json
//   node scripts/build-models-measured.mjs --check  exit 1 if the committed file is stale
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isR1, isR2, UNCONFIRMED_TAGS } from "./build-own-model-disclosure.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = join(ROOT, "public", "signed", "card_index.json");
const MILL = join(ROOT, "public", "interop", "mill-cards-signed");
const OUT = join(ROOT, "public", "interop", "models-measured.json");
const DID = join(ROOT, "public", ".well-known", "did.json");

// The JS edge signer's canonical form (sorted keys, compact), the preimage of every mill card
// signature (scripts/sign_mill_cards.py; scripts/surface/build-hub-cards-index.mjs uses the same).
function canonicalDeep(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalDeep).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalDeep(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

function didKeys() {
  const doc = JSON.parse(readFileSync(DID, "utf8"));
  const keys = new Map();
  for (const vm of doc.verificationMethod ?? []) {
    if (vm?.publicKeyJwk?.crv !== "Ed25519") continue;
    keys.set(vm.id, createPublicKey({ key: vm.publicKeyJwk, format: "jwk" }));
  }
  return keys;
}

// The display-name policy of scripts/build-card-matrix.mjs and scripts/brand-gate.mjs: a model id
// that carries an internal codename is published as "withheld-name-N" (the signed card itself keeps
// the real id; this derived file is a display artifact and is swept by the gate).
export const UNPUBLISHABLE_NAME =
  /\bsovereign\b|\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b|\bceasai|\bbyzantine\b|\bBFT\b|crown[\s-]?jewels?|goldmines|black swans|\bOWEM\b|\bSIGIL\b|\bventuri|\bpontius|\blaputa/i;

export function normalise(id) {
  if (typeof id !== "string") return null;
  let m = id.trim();
  m = m.replace(/^(ollama|t4):/i, "");
  m = m.replace(/@sha256:[0-9a-f]{16,}$/i, "");
  m = m.replace(/:latest$/i, "");
  return m || null;
}

export function kindOf(raw) {
  if (isR1(raw) || isR2(raw)) return "own";
  if (UNCONFIRMED_TAGS.includes(raw)) return "own_unconfirmed";
  return "third_party";
}

function readJsonl(p, key) {
  const ids = new Set();
  if (!existsSync(p)) return ids;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const j = JSON.parse(t);
      if (j[key]) ids.add(j[key]);
    } catch {
      /* a malformed line excludes nothing */
    }
  }
  return ids;
}

export function derive() {
  const models = new Map(); // normalised id -> { id, kind, sources:Set, cards, axes:Set, raw:Set }
  const hash = createHash("sha256");
  const add = (raw, source, axis, admitted = false, cardId = null) => {
    const id = normalise(raw);
    if (!id) return;
    const kind = kindOf(raw);
    const row = models.get(id) ?? { id, kind, sources: new Set(), cards: 0, axes: new Set(), raw: new Set(), admitted: false, firstCard: null };
    if (admitted) row.admitted = true;
    // The first signed-card-index card for this model, in index order: a card the browser
    // verifier can load by id (/signed/cards/<id>.json). Mill cards live elsewhere, so they never set it.
    if (cardId && !row.firstCard) row.firstCard = cardId;
    // A kind can only move towards "own": if any recorded form of the name is ours, the row is ours.
    if (kind === "own" || (kind === "own_unconfirmed" && row.kind === "third_party")) row.kind = kind;
    row.sources.add(source);
    row.cards += 1;
    if (axis) row.axes.add(axis);
    row.raw.add(raw);
    models.set(id, row);
  };

  // A. signed card index
  const indexBytes = readFileSync(INDEX);
  hash.update(indexBytes);
  const index = JSON.parse(indexBytes);
  let aRead = 0;
  for (const c of index.cards ?? []) {
    const rec = JSON.parse(readFileSync(join(ROOT, "public", c.card_url), "utf8"));
    if (rec?.id !== c.card) continue;
    add(rec?.body?.model, "signed-card-index", rec?.body?.axis, false, c.card);
    aRead += 1;
  }

  // B. mill cards
  const withdrawn = readJsonl(join(MILL, "WITHDRAWN.jsonl"), "withdrawn_id");
  const superseded = readJsonl(join(MILL, "SUPERSEDED.jsonl"), "superseded_id");
  const files = readdirSync(MILL).filter((f) => /^signed-.*\.json$/.test(f)).sort();
  const keys = didKeys();
  const skipped = { signature_not_valid: 0, not_measured: 0, not_quotable: 0, under_30: 0, unsigned: 0, withdrawn: 0, superseded: 0 };
  let bCounted = 0;
  let bAdmitted = 0;
  for (const f of files) {
    const bytes = readFileSync(join(MILL, f));
    hash.update(bytes);
    const j = JSON.parse(bytes);
    const b = j.body ?? {};
    const n = typeof b.n === "number" ? b.n : j.n;
    const key = keys.get(j.did);
    let valid = false;
    try {
      const pre = Buffer.from(canonicalDeep(b), "utf8");
      valid = !!key && typeof j.signature === "string" && j.id === createHash("sha256").update(pre).digest("hex") &&
        edVerify(null, pre, key, Buffer.from(j.signature, "hex"));
    } catch {
      valid = false;
    }
    if (!valid) { skipped.signature_not_valid++; continue; }
    if (b.status !== "MEASURED") { skipped.not_measured++; continue; }
    if (j.quotable !== true) { skipped.not_quotable++; continue; }
    if (!(typeof n === "number" && n >= 30)) { skipped.under_30++; continue; }
    // A body that states its own signature state must say SIGNED (STAGED_UNSIGNED is excluded).
    // Older bodies carry no such field; their signature was verified above, which is the test.
    if (b.signature_state !== undefined && b.signature_state !== "SIGNED") { skipped.unsigned++; continue; }
    if (withdrawn.has(j.id)) { skipped.withdrawn++; continue; }
    if (superseded.has(j.id)) { skipped.superseded++; continue; }
    add(b.model, "mill-cards-signed", b.axis, !!b.admission);
    bCounted += 1;
    if (b.admission) bAdmitted += 1;
  }

  const withheldIds = [...models.values()]
    .filter((r) => UNPUBLISHABLE_NAME.test(r.id) || [...r.raw].some((x) => UNPUBLISHABLE_NAME.test(x)))
    .map((r) => r.id)
    .sort();
  const shown = new Map(withheldIds.map((id, i) => [id, `withheld-name-${i + 1}`]));
  const rows = [...models.values()]
    .map((r) => ({
      id: shown.get(r.id) ?? r.id,
      name_published: !shown.has(r.id),
      kind: r.kind,
      cards: r.cards,
      axes: r.axes.size,
      sources: [...r.sources].sort(),
      admission_receipt: r.admitted,
      // Withheld names get no card id: the signed card keeps the real id, and linking it would
      // publish the name the row withholds.
      first_signed_card: shown.has(r.id) ? null : r.firstCard,
      recorded_as: shown.has(r.id) ? [] : [...r.raw].sort(),
    }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || b.cards - a.cards || a.id.localeCompare(b.id));
  const count = (k) => rows.filter((r) => r.kind === k).length;
  // Distinct third-party models with at least one counted card on each axis, keyed by the axis name
  // the card records (the signed index says "gspc-safety" where the mill says "safety"; they are
  // different instruments and are not merged). The HF Jobs axis picker reads this to grade the
  // least-covered axes first (.github/workflows/hf-jobs-mill-launch.yml, scripts/hf/mill_axis_pick.py).
  const byAxis = {};
  for (const r of models.values()) {
    if (r.kind !== "third_party") continue;
    for (const a of r.axes) byAxis[a] = (byAxis[a] ?? 0) + 1;
  }
  const by_axis = Object.fromEntries(Object.keys(byAxis).sort().map((a) => [a, byAxis[a]]));

  return {
    schema: "csoai.models-measured/0.1",
    what: "Distinct AI models with at least one signed, quotable measurement on a frozen bank, split by whose model it is.",
    headline: {
      third_party_models: count("third_party"),
      own_models_excluded: count("own"),
      own_unconfirmed: count("own_unconfirmed"),
      third_party_with_admission_receipt: rows.filter((r) => r.kind === "third_party" && r.admission_receipt).length,
      label: "models measured on frozen banks (third-party models only; our own are listed separately and never counted in)",
    },
    not_this: [
      "Not totals.model_fleets on /api/gspc: that counts the model-comparison AXES (one fleet per axis), not models.",
      "Not a ranking and not a certificate. A model on this list was measured; nothing here says it is good, safe or compliant.",
      "Not the fact runs: deterministic-facts axes grade servers, endpoints and public records, which have no model.",
    ],
    identity_rule:
      "The identifier the card records, with only an 'ollama:'/'t4:' route prefix, an '@sha256:' digest and ':latest' removed. " +
      "An Ollama tag (quantised build) and a Hugging Face repo are counted as different models even when they share a base.",
    name_policy:
      "A model id carrying an internal codename is shown as withheld-name-N, the policy of scripts/build-card-matrix.mjs; " +
      "it is still counted in its own group, and the signed card keeps the real id.",
    own_model_rule: "scripts/build-own-model-disclosure.mjs R1 (sov*, clan*), R2 (council*) and its UNCONFIRMED_TAGS list, imported.",
    sources: {
      signed_card_index: { path: "/signed/card_index.json", cards_read: aRead },
      mill_cards_signed: {
        path: "/interop/mill-cards-signed/",
        files_read: files.length,
        cards_counted: bCounted,
        cards_counted_with_admission_receipt: bAdmitted,
        cards_not_counted: skipped,
        rule: "Ed25519 signature verifies under the did:web:csoai.org key it names, id == sha256(canonical body), status MEASURED, quotable, n >= 30, not STAGED_UNSIGNED, not withdrawn, not superseded",
      },
    },
    by_axis_rule:
      "by_axis[axis] = distinct third-party models with at least one counted card on that axis, under the axis name the card records. " +
      "An axis absent here has no counted third-party card; it is not a measured zero.",
    by_axis,
    inputs_sha256: hash.digest("hex"),
    models: rows,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = JSON.stringify(derive(), null, 1) + "\n";
  if (process.argv.includes("--check")) {
    const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (cur !== text) {
      console.error("build-models-measured: public/interop/models-measured.json is stale; run node scripts/build-models-measured.mjs");
      process.exit(1);
    }
    console.log("build-models-measured: up to date");
  } else {
    writeFileSync(OUT, text);
    const h = JSON.parse(text).headline;
    console.log(`build-models-measured: ${h.third_party_models} third-party models, ${h.own_models_excluded} own (excluded), ${h.own_unconfirmed} unconfirmed`);
  }
}
