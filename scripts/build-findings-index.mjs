#!/usr/bin/env node
/**
 * build-findings-index.mjs — materialise the REGULATION-FINDINGS index.
 *
 * Joins, per (model × axis) SIGNED card cell, three things nobody else cross-references:
 *   1. the MEASUREMENT   — from public/signed/card-matrix.json (itself derived, byte-for-byte,
 *                          from the 335 signed cards; it already neutralises retired brand names
 *                          to withheld-name-N, so we inherit that display policy unchanged).
 *   2. the CROSSWALK     — from client/src/data/regulator-crosswalk.json: axis → 'relevant-to'
 *                          pointers at EU AI Act articles, NIST AI RMF functions, OWASP ASI controls.
 *   3. the FINE TIER     — the STATUTORY MAXIMUM for the mapped tier, cited to EU AI Act Art 99,
 *                          matching the live edge-signed /api/regulation feed.
 *
 * HONESTY (absolute — enforced structurally here, not by good intentions):
 *   · Every finding is DISCOVERED and stands behind a signed card (card_url + signed:true). A cell
 *     with no card is not emitted. Nothing is MEASURED without a card.
 *   · Regulatory mappings are POINTERS. relation is always "relevant-to" — never "violates",
 *     never "complies". This script refuses to emit any other relation.
 *   · No fine is asserted as owed. Each finding carries only statutory_maximum for the tier, cited;
 *     no_fine_asserted_owed is hard-coded true. Voluntary frameworks / security taxonomies carry null.
 *   · Capability benchmarks (arc/gsm8k/mmlu/swag) get ZERO obligation pointers — a math score is not
 *     a compliance finding, and pretending otherwise is exactly the dishonesty this layer exists to avoid.
 *
 * Output: public/signed/findings_index.json (under /signed/, so the brand-gate carve-out that keeps
 * the real signed model ids in card_index.json also covers this derived index).
 *
 * Deterministic: re-running on an unchanged matrix + crosswalk writes identical bytes (sorted keys,
 * no clock). The only date in the output is the matrix's own as_of.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const MATRIX = join(REPO, "public/signed/card-matrix.json");
const CROSSWALK = join(REPO, "client/src/data/regulator-crosswalk.json");
const OUT = join(REPO, "public/signed/findings_index.json");

const round = (x, p = 4) => (typeof x === "number" ? Math.round(x * 10 ** p) / 10 ** p : x);

function main() {
  const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
  const xwalk = JSON.parse(readFileSync(CROSSWALK, "utf8"));
  const tierTable = xwalk.fine_tiers.eu_ai_act;
  const noFine = xwalk.fine_tiers.no_fine;
  const regById = Object.fromEntries(xwalk.regulators.map((r) => [r.id, r]));

  // resolve a tier id to its cited statutory maximum
  const tierOf = (tierId) => {
    if (tierId === "no_fine" || tierId == null) return { ...noFine, tier: "no_fine" };
    const t = tierTable[tierId];
    if (!t) throw new Error(`unknown fine tier: ${tierId}`);
    return { ...t, tier: tierId };
  };

  // rank tiers so we can report the highest statutory maximum a finding touches (never summed)
  const TIER_RANK = { prohibited_practices: 3, most_obligations_incl_art50_and_gpai: 2, incorrect_or_misleading_info: 1, no_fine: 0 };

  // build the per-axis crosswalk block (pointers + resolved fine tiers) once, reuse per finding
  const axisBlock = {};
  for (const [axisId, a] of Object.entries(xwalk.axes)) {
    const pointers = (a.pointers || []).map((p) => {
      if (p.relation !== "relevant-to") {
        throw new Error(`illegal relation '${p.relation}' on axis ${axisId} — only 'relevant-to' is permitted (pointer, never determination)`);
      }
      const t = tierOf(p.tier);
      return {
        regulator: p.regulator,
        regulator_name: regById[p.regulator]?.name ?? p.regulator,
        relation: "relevant-to",
        obligation: p.obligation,
        statutory_maximum: t.statutory_maximum,
        fine_cited_to: t.cited_to,
        fine_applies_to: t.applies_to,
        tier: t.tier,
        no_fine_asserted_owed: true,
      };
    });
    const topTier = pointers.reduce((m, p) => (TIER_RANK[p.tier] > TIER_RANK[m] ? p.tier : m), "no_fine");
    axisBlock[axisId] = {
      axis: axisId,
      label: a.label,
      kind: a.kind,
      bench: a.bench,
      keywords: a.keywords || "",
      no_obligation_reason: a.no_obligation_reason,
      pointers,
      highest_statutory_maximum: topTier === "no_fine"
        ? null
        : { ...tierOf(topTier), note: "Highest statutory maximum among the obligations this axis is relevant-to. NOT an assertion any fine is owed; the max applies to the obligation, not to any measured result." },
    };
  }

  // per-model published-name policy, inherited from the matrix
  const modelMeta = Object.fromEntries((matrix.models || []).map((m) => [m.id, m]));

  // one finding per signed cell
  const findings = [];
  for (const c of matrix.cells) {
    const ab = axisBlock[c.axis];
    if (!ab) {
      // an axis in the matrix with no crosswalk entry: emit honestly with empty pointers rather than drop it
      findings.push({
        model: c.model,
        axis: c.axis,
        axis_label: c.axis,
        axis_kind: "unmapped",
        measurement: measurement(c),
        crosswalk: { pointers: [], highest_statutory_maximum: null, note: "No crosswalk entry for this axis yet — pointers are UNMAPPED, not absent-because-compliant." },
        search_text: [c.model, c.axis].join(" ").toLowerCase(),
      });
      continue;
    }
    const regs = [...new Set(ab.pointers.map((p) => p.regulator))];
    findings.push({
      model: c.model,
      axis: c.axis,
      axis_label: ab.label,
      axis_kind: ab.kind,
      measurement: measurement(c),
      crosswalk: {
        pointers: ab.pointers,
        highest_statutory_maximum: ab.highest_statutory_maximum,
        no_obligation_reason: ab.no_obligation_reason,
      },
      search_text: [
        c.model, c.axis, ab.label, ab.bench || "", ab.keywords || "",
        ...ab.pointers.map((p) => `${p.regulator_name} ${p.obligation}`),
        regs.join(" "),
      ].join(" ").toLowerCase(),
    });
  }

  // by-model rollup
  const byModel = {};
  for (const f of findings) {
    (byModel[f.model] ??= { model: f.model, name_published: modelMeta[f.model]?.name_published ?? true, findings: [], axes: new Set(), regulators: new Set() }).findings.push(fRef(f));
    byModel[f.model].axes.add(f.axis);
    for (const p of f.crosswalk.pointers) byModel[f.model].regulators.add(p.regulator);
  }
  const models = Object.values(byModel).map((m) => ({
    model: m.model,
    name_published: m.name_published,
    n_findings: m.findings.length,
    axes: [...m.axes].sort(),
    regulators: [...m.regulators].sort(),
    mean_accuracy: round(mean(m.findings.map((f) => f.accuracy).filter((x) => typeof x === "number"))),
  })).sort((a, b) => a.model.localeCompare(b.model));

  // by-regulator rollup
  const byReg = {};
  for (const r of xwalk.regulators) byReg[r.id] = { ...r, axes: new Set(), n_findings: 0, models: new Set(), tiers: new Set() };
  for (const f of findings) {
    for (const p of f.crosswalk.pointers) {
      const b = byReg[p.regulator];
      if (!b) continue;
      b.axes.add(f.axis);
      b.models.add(f.model);
      b.n_findings += 1;
      b.tiers.add(p.tier);
    }
  }
  const regulators = xwalk.regulators.map((r) => {
    const b = byReg[r.id];
    const axes = [...b.axes].sort();
    return {
      id: r.id,
      name: r.name,
      long_name: r.long_name,
      authority: r.authority,
      kind: r.kind,
      fine_regime: r.fine_regime,
      source: r.source,
      non_claim: r.non_claim,
      controls: r.controls,
      axes_relevant: axes.map((axisId) => ({
        axis: axisId,
        label: axisBlock[axisId]?.label ?? axisId,
        obligations: (axisBlock[axisId]?.pointers || []).filter((p) => p.regulator === r.id).map((p) => ({ obligation: p.obligation, statutory_maximum: p.statutory_maximum, fine_cited_to: p.fine_cited_to, tier: p.tier, no_fine_asserted_owed: true })),
      })),
      n_findings_relevant: b.n_findings,
      n_models_measured: b.models.size,
      fine_tiers: r.id === "eu-ai-act" ? tierTable : null,
    };
  });

  const axes = Object.values(axisBlock).map((ab) => {
    const fs = findings.filter((f) => f.axis === ab.axis);
    return {
      axis: ab.axis,
      label: ab.label,
      kind: ab.kind,
      bench: ab.bench,
      n_findings: fs.length,
      n_models: new Set(fs.map((f) => f.model)).size,
      mean_accuracy: round(mean(fs.map((f) => f.measurement.accuracy).filter((x) => typeof x === "number"))),
      regulators: [...new Set(ab.pointers.map((p) => p.regulator))].sort(),
      pointers: ab.pointers,
      highest_statutory_maximum: ab.highest_statutory_maximum,
      no_obligation_reason: ab.no_obligation_reason,
    };
  }).sort((a, b) => a.axis.localeCompare(b.axis));

  const out = {
    schema: "csoai.regulation-findings-index/0.1",
    title: "Regulation-findings index — every signed (model × axis) card, joined to its regulator crosswalk and statutory fine tier",
    honesty: {
      findings_are: "DISCOVERED / measured, and every one stands behind an Ed25519-signed card (card_url, signed:true). Nothing here is MEASURED without a card.",
      mappings_are: "CROSSWALK POINTERS. Every relation is 'relevant-to' — this index never says a model 'violates' or 'complies with' any provision. Whether a measured result clears an obligation is a legal question for counsel and the competent authority, not a measured one.",
      fines_are: "the STATUTORY MAXIMUM for the mapped tier, cited to EU AI Act Art 99. No fine is asserted as owed by anyone (no_fine_asserted_owed:true on every pointer). Voluntary frameworks (NIST AI RMF, ISO 42001) and security taxonomies (OWASP ASI) carry no fine — stated as null, never a fabricated figure.",
      measure_not_certify: "CSOAI measures; it does not certify, and is not a notified body or an enforcer.",
      capability_benchmarks: "ARC / GSM8K / MMLU / SWAG carry ZERO obligation pointers on purpose — a capability score is not a compliance finding.",
      empty_is_first_class: "Only measured cells appear. The 689 unmeasured (model × axis) pairs (of 1024 possible) are honestly absent, not zeros.",
    },
    generated_from: {
      measurement: "public/signed/card-matrix.json (derived byte-for-byte from public/signed/cards/*.json, 335 signed cards)",
      crosswalk: "client/src/data/regulator-crosswalk.json",
      fine_tiers: "EU AI Act Art 99 — transcribed to match the live edge-signed /api/regulation feed",
      note: "Rebuild with: node scripts/build-findings-index.mjs. Deterministic — unchanged inputs write identical bytes.",
    },
    as_of: matrix.as_of,
    as_of_field: matrix.as_of_field,
    counts: {
      findings: findings.length,
      models: models.length,
      axes: axes.length,
      regulators: regulators.length,
      possible_cells: matrix.counts?.possible_cells ?? null,
      unmeasured_cells: (matrix.counts?.possible_cells ?? 0) - findings.length,
    },
    fine_tiers: tierTable,
    regulators,
    axes,
    models,
    findings,
  };

  writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
  console.log(`findings-index: ${findings.length} findings · ${models.length} models · ${axes.length} axes · ${regulators.length} regulators -> ${OUT.replace(REPO + "/", "")}`);

  function measurement(c) {
    return {
      accuracy: round(c.accuracy),
      status: "DISCOVERED",
      status_note: "measured on one small bank on one date; a signed card stands behind it",
      card: c.card,
      card_url: c.card_url,
      signed: c.signed === true,
      alg: c.alg,
      pubkey: c.pubkey,
      measured_on: c.created,
    };
  }
}

function fRef(f) {
  return { model: f.model, axis: f.axis, axis_label: f.axis_label, accuracy: f.measurement.accuracy, card_url: f.measurement.card_url, signed: f.measurement.signed, n_pointers: f.crosswalk.pointers.length };
}
function mean(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; }

main();
