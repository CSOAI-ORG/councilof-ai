// functions/api/gspc.ts — living board. Slot counts are derived from the payload, never typed.
// Restored from signed board / pre-PR#425 blob b4b3ab1788ec044156da0d4962189fe5f4dd975f.
// Scores are verbatim — nothing invented. Split into private modules for deploy only.

import type { AxisScore } from "./_gspc_types";
import { MEASURED_ON } from "./_gspc_types";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_FIN } from "./_gspc_axes_fin";
import { MEASURED_IN_LANE } from "./_gspc_lane";

// 22-axis canon (ADR-001): 14 GSPC behavioural axes + 8 financial/domain axes.
// Swept into the payload 2026-08-26. Before this, the 8 financial axes were ruled
// in but absent from the data, so the board reported 14 — the un-swept state.
const AXES: AxisScore[] = [...AXES_A, ...AXES_B, ...AXES_FIN];

const round = (x: number, p = 4) => Math.round(x * 10 ** p) / 10 ** p;

// ── neutral-body rule: our own models never lead the PUBLIC board ─────────────
// CSOAI measures; it must not self-preference. Eight of the fourteen model-comparison
// axes had our own tuned "council-*-v3-light (council specialist)" fine-tunes as the
// point-leader. A measurement body cannot publish its own model as the winner over the
// vendors it measures, so those models are pulled off the PUBLIC leaderboard here.
//
// This is a SERVING-LAYER exclusion, not a deletion: the axis modules and the signed
// measurement cards are untouched (the measurement happened and stays on the record —
// see /api/cards and /signed/). We simply do not name our own model as the public leader.
const isOwnCouncilModel = (name?: string | null): boolean =>
  typeof name === "string" && (/^council\b/i.test(name.trim()) || /\(council specialist\)/i.test(name));

// Remove our own model from an axis's PUBLIC leader slot. Only touches model-comparison
// axes our own model led; every external-led axis (and every fact axis) passes through
// unchanged. The leader-specific numbers (the leader's accuracy, its Wilson interval, its
// macro_f1 / unparsed_rate, and the council-vs-base separation determination) described OUR
// model, so with it excluded they cannot stand as a public ranking. The external runner-up's
// per-axis numbers are NOT carried in this payload (they lived on the measurement pod), so
// they are dropped rather than reattributed — never fabricated. The axis stays MEASURED:
// external models answered the same frozen bank (fleet_mean is over the whole fleet), so the
// measurement is real; it simply carries no public leader until an external-only re-rank is
// published. Fleet-level aggregates (fleet_mean, mean_harm, cvar05_harm) are NOT a
// self-preference claim and are kept.
type PublicAxis = AxisScore & {
  excluded_leader?: string;
  public_leader_state?: string;
  excluded_note?: string;
  measurement_note?: string;
};
const excludeOwnLeader = (a: AxisScore): PublicAxis => {
  if (a.kind !== "model-comparison" || !isOwnCouncilModel(a.leader)) return a;
  const {
    accuracy: _acc,
    accuracy_is: _accIs,
    interval: _int,
    macro_f1: _mf1,
    unparsed_rate: _upr,
    separation_p: _sp,
    separation_basis: _sb,
    leader: _ld,
    note: _note,
    ...rest
  } = a;
  return {
    ...rest,
    leader: undefined,
    // No separation determination stands on the public board once the tested leader is
    // removed. UNTESTED (not SEPARATED/TIE) keeps this axis out of the separated/tie/mean
    // tallies below, which is the honest count of what the public board can still assert.
    separation: "UNTESTED",
    excluded_leader: a.leader,
    public_leader_state: "EXCLUDED_OWN_MODEL",
    // The primary note is neutral — the original note narrated our own model leading, which
    // is exactly the self-preference being removed, so it must not be the public sentence.
    note:
      "No public leader: our own council specialist held the point lead and a neutral measurement " +
      "body does not rank its own models against the vendors it measures. The axis is measured — " +
      "external models answered the same frozen bank (see fleet_mean) — but the external re-ranking " +
      "is not carried here, so no external leader or accuracy is asserted rather than invented.",
    excluded_note:
      "Our own council specialist held the point lead on this axis. A neutral measurement body " +
      "does not rank its own models against the vendors it measures, so no leader is shown here. " +
      "The measurement is real and the signed card still exists; the external re-ranking requires a " +
      "per-model recompute not carried in this payload, so no external leader or accuracy is invented.",
    // The original measurement note is preserved verbatim for the record — it DESCRIBES the run
    // (which included our own models), it is NOT the public ranking. Kept so the provenance,
    // fleet findings and bank details on these axes are not lost by the exclusion.
    measurement_note: a.note,
  };
};

// ── carded-leader rule: never name a PUBLIC leader we cannot back with a signed card ─────────
// The board's core promise is that every measured cell links to the Ed25519 card behind it —
// a skeptic can fetch the per-model card and recompute the ranking (see /api/cards and
// /signed/card_index.json). Three model-comparison axes named an EXTERNAL base model as the
// point-leader (with an implied accuracy) but carry ZERO signed per-model cards in the public
// card index, so that promise is broken on them: the ranking cannot be recomputed or linked to
// a card. On any such axis we DROP the public leader rather than assert a number nothing backs.
//
// Carded-vs-uncarded is DERIVED from the published card index (/signed/card_index.json — 335
// signed cards over 16 card-axis keys as of 2026-09-01). The card-axis keys are NOT the board
// axis ids: the crosswalk is genuinely irregular (six prefixed, one direct, two suffixed), so
// it is written out explicitly here rather than guessed by string munging that would silently
// mis-map an axis. Each entry below resolved to >=1 signed:true card in that index:
//
//   board axis id   ->  signed card-index axis key (count)
//   governance      ->  gspc-governance        (21)
//   safety          ->  gspc-safety            (21)   [external leader gemma3:12b — CARDED]
//   provenance      ->  gspc-provenance        (21)
//   continuity      ->  gspc-continuity        (21)
//   conformance     ->  gspc-conformance       (21)
//   openness        ->  gspc-openness          (21)
//   care            ->  care                   (23)
//   swarm           ->  swarm-candidates       (7)    [external leader qwen2.5:7b — CARDED]
//   jail            ->  jail-escape-detection  (8)    [external leader qwen2.5:0.5b — CARDED]
//
// The five model-comparison axes with NO card-index key are machinery-conformity, cross-reality,
// detector-interop, art5-safeguard and affect. art5-safeguard and affect are own-council-led and
// already have their leader removed by excludeOwnLeader above, so in practice this rule drops the
// public leader on exactly the three confirmed uncarded EXTERNAL-leader axes: machinery-conformity,
// cross-reality, detector-interop. It is written as a positive ALLOW-LIST (keep a leader only if
// the axis is carded) so a future axis that ships an uncarded external leader is dropped by
// default — the honest failure direction. This mirrors the own-model leader-drop above and, like
// it, is a SERVING-LAYER change only: the axis modules and signed cards are untouched.
const CARDED_MODEL_AXES = new Set<string>([
  "governance", "safety", "provenance", "continuity", "conformance",
  "openness", "care", "swarm", "jail",
]);
const axisHasSignedCard = (axisId: string): boolean => CARDED_MODEL_AXES.has(axisId);

// Drop the PUBLIC leader from a model-comparison axis whose named leader is NOT backed by a
// signed card. Runs AFTER excludeOwnLeader, so it only ever sees axes that still name a leader
// (our own-model leaders were already removed). The leader-specific numbers (accuracy, its
// Wilson interval, macro_f1 / unparsed_rate, and the separation determination) all describe the
// unbacked leader, so with it removed they cannot stand as a public ranking and are dropped
// rather than reattributed — never fabricated. The axis stays MEASURED: external models answered
// the same frozen bank, so fleet_mean is a real aggregate and is kept, and measured_axes is
// unchanged. Only the unverifiable per-model leader claim is removed.
const dropUncardedLeader = (a: PublicAxis): PublicAxis => {
  if (a.kind !== "model-comparison" || typeof a.leader !== "string" || axisHasSignedCard(a.axis)) return a;
  const {
    accuracy: _acc,
    accuracy_is: _accIs,
    interval: _int,
    macro_f1: _mf1,
    unparsed_rate: _upr,
    separation_p: _sp,
    separation_basis: _sb,
    leader: _ld,
    note: _note,
    ...rest
  } = a;
  return {
    ...rest,
    leader: undefined,
    // No separation determination stands once the tested leader is removed — UNTESTED keeps this
    // axis out of the separated/tie tallies, the honest count of what the public board can assert.
    separation: "UNTESTED",
    excluded_leader: a.leader,
    public_leader_state: "NO_SIGNED_CARD",
    note:
      "No public leader: this axis is measured as a fleet aggregate against the frozen bank " +
      "(see fleet_mean), but no signed per-model card is carried in this payload, so no leader " +
      "or accuracy is asserted rather than invented — see /api/cards. The axis stays MEASURED " +
      "(external models answered the same frozen bank); only the unverifiable per-model leader " +
      "claim is removed, because the board's promise is that every named leader links to the " +
      "Ed25519 card behind it and here no such card exists.",
    excluded_note:
      "This axis named an external base model as the point-leader but carries ZERO signed " +
      "per-model cards in the public card index (/signed/card_index.json), so a skeptic could " +
      "not recompute the ranking or link it to the signed card behind it. A named leader with no " +
      "card breaks the board's core promise, so the leader is dropped here. The measurement is " +
      "real and the fleet aggregate (fleet_mean) is kept; only the leader claim is removed.",
    // The original measurement note is preserved verbatim for the record — it DESCRIBES the run
    // (it narrated the uncarded leader), it is NOT the public ranking.
    measurement_note: a.note,
  };
};

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const axis = url.searchParams.get("axis");

  const selectedRaw = axis ? AXES.filter((a) => a.axis === axis) : AXES;
  if (axis && selectedRaw.length === 0) {
    return new Response(
      JSON.stringify({ error: "unknown axis", known: AXES.map((a) => a.axis) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }
  // The PUBLIC view: our own models removed from every leader slot. Everything downstream
  // (totals, separation stats, means, the axes array, the living stamp) derives from this,
  // so a council model can never re-enter a public count.
  const selected = selectedRaw.map(excludeOwnLeader).map(dropUncardedLeader);
  const ownLedExcludedAxes = selectedRaw
    .filter((a) => a.kind === "model-comparison" && isOwnCouncilModel(a.leader))
    .map((a) => a.axis);
  // Axes whose public leader was dropped because no signed card backs it. Derived from the
  // served payload (public_leader_state), never typed, so it can never disagree with the axes.
  const uncardedLeaderDroppedAxes = selected
    .filter((a) => (a as PublicAxis).public_leader_state === "NO_SIGNED_CARD")
    .map((a) => a.axis);
  const externallyLedAxes = selected
    .filter((a) => a.kind === "model-comparison" && a.status === "MEASURED" && typeof a.leader === "string")
    .map((a) => a.axis);

  const items = selected.reduce((s, a) => s + a.n, 0);
  const measuredSlots = selected.filter((a) => a.status === "MEASURED");
  // Separation is a property of a MODEL-COMPARISON axis only: it asks whether a
  // leader's lead over a fleet is statistically real. A deterministic-facts axis
  // has no fleet and no leader, so it is not "untested" — the test does not apply.
  // Scoping these three counters to kind === "model-comparison" is what stops a
  // financial axis silently entering a sentence about McNemar separation.
  const comparisonSlots = measuredSlots.filter((a) => a.kind === "model-comparison");
  const measuredCount = comparisonSlots.filter((a) => a.separation !== "UNTESTED").length;
  const separatedNames = comparisonSlots.filter((a) => a.separation === "SEPARATED").map((a) => a.axis);
  const tieCount = comparisonSlots.filter((a) => a.separation === "TIE").length;
  // Every bank is named by a bare slug (e.g. "csoai/gspc-gov"), which a stranger cannot
  // resolve without already knowing the host. Our own rater-transparency axis measured
  // /api/gspc as carrying ZERO resolvable URLs (2026-08-26) — the exact friction that axis
  // exists to catch, on our own surface. Resolve every bank to a fetchable URL.
  // A financial axis has NO HuggingFace bank. Prefixing BANK_HOST onto a missing
  // slug would mint a dataset_url that 404s — a resolvable-looking link to nothing,
  // which is worse than no link. Axes without a bank are left alone; the measured
  // one carries evidence_url to its signed run instead, and a declared slot with no
  // evidence carries neither.
  const BANK_HOST = "https://huggingface.co/datasets/";
  // A bank slug is "<owner>/<name>" and nothing else. Concatenating BANK_HOST onto
  // whatever `dataset` happens to hold is how the jail axis published
  // "https://huggingface.co/datasets/published: csoai/gspc-jail-goldbank (frozen 71-cell
  // gold bank, HF 2026-08-25)" — a string curl rejects as a malformed URL, sitting
  // directly under a bank_note asserting that every dataset_url resolves (outside audit
  // D10, 2026-08-26). The slug is now validated. A slug that does not match is NOT
  // silently dropped and NOT concatenated anyway: the axis publishes
  // dataset_url: null with dataset_url_state UNRESOLVABLE and the raw value, so the
  // fault is visible on the surface that carries it. bank_note below is derived from
  // this same predicate, so the sentence and the bytes cannot disagree again.
  const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/;
  const withResolvableBank = <T extends { dataset?: string }>(a: T) => {
    if (!a || typeof a.dataset !== "string" || !a.dataset) return a;
    if (SLUG.test(a.dataset)) return { ...a, dataset_url: BANK_HOST + a.dataset };
    return {
      ...a,
      dataset_url: null,
      dataset_url_state: "UNRESOLVABLE",
      dataset_url_note:
        "This axis's `dataset` value is not a bare <owner>/<name> bank slug, so no URL is " +
        "minted for it. The raw value is published verbatim above rather than concatenated " +
        "into a link that would not resolve.",
    };
  };
  // Counted, not asserted: how many axis carry a bank, and how many of those resolved.
  const banked = selected.filter((a) => typeof a.dataset === "string" && a.dataset);
  const bankResolved = banked.filter((a) => SLUG.test(a.dataset as string));
  const bankUnresolvable = banked.filter((a) => !SLUG.test(a.dataset as string));

  // Living stamp is mutated at the edge (below) when BOARD_SIGN_KEY is present.
  // The historical UNVERIFIABLE stamp is kept on `superseded`, never deleted.
  const measuredOn = {
    ...MEASURED_ON,
    living_stamp: { ...MEASURED_ON.living_stamp },
  };

  const body = {
    schema: "csoai.gspc-axes/0.5",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    doi: "10.5281/zenodo.21991104",
    doi_note: "GSPC Methodology and the Frozen Corpus Anchor (the canonical methodology record — one citable spine, HB.0). Supersedes the stale 21755656 (an unrelated EAT-benchmark dataset).",
    measured_on: measuredOn,
    note:
      "Measurement, not certification. Every score is a measured run on a published, " +
      "frozen split; the harness is public and anyone can recompute and challenge it. " +
      "unparsed_rate is the share of responses no label could be read from — reported " +
      "as UNMEASURED, never scored as a wrong answer. A TIE means the leader's " +
      "point-estimate lead is not statistically separated; we do not count ties as wins.",
    // Playbook T2 (2 Sep 2026): serve the closed state vocabularies so no client hardcodes them.
    state_enum: {
      status: ["MEASURED", "UNMEASURED", "DRAFT", "SPEC", "PLANNED"],
      separation: ["SEPARATED", "TIE", "UNTESTED"],
      public_leader_state: ["PUBLIC", "EXCLUDED_OWN_MODEL", "NO_SIGNED_CARD"],
      verification: ["VALID", "INVALID", "UNCHECKABLE"],
      note: "Absence of a field means UNMEASURED. TIE is never a win. A withheld leader is a state, not a zero.",
    },
    totals: (() => {
      const m = selected.filter((a) => a.status === "MEASURED");
      const cmp = m.filter((a) => a.kind === "model-comparison");
      // Average only the axis that actually carry the field — living-stamp axis have no
      // macro_f1 / mean_harm / unparsed_rate and must not drag a fabricated 0 into the mean.
      // Means are additionally scoped to model-comparison axes: a deterministic-facts axis
      // has no accuracy at all, and a declared slot has no measurement to average.
      const avg = (f: (a: typeof cmp[number]) => number | undefined) => {
        const vals = cmp.map(f).filter((v): v is number => typeof v === "number");
        return vals.length ? round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
      };

      // ── the count, derived, never typed ──────────────────────────────────────
      // A SLOT ON THE BOARD IS NOT A MEASUREMENT. The 22-axis canon is a count of
      // slots; measured_axes is the count of slots with a real run behind them.
      // Every axis now carries a run, so measured_axes == axes == 22. The grammar
      // still DERIVES both from the axis array rather than typing either: if a
      // future slot is added with no run, the gap re-appears honestly on its own.
      // Every number below is computed from the axis array.
      const measured = m.length;                       // status MEASURED — a run exists
      const unmeasured = selected.length - measured;   // slot published, no run
      const bySelectedFamily = (fam: "gspc" | "financial") => {
        const all = selected.filter((a) => a.family === fam);
        return { axes: all.length, measured: all.filter((a) => a.status === "MEASURED").length };
      };
      return {
        axes: selected.length,
        measured_axes: measured,
        unmeasured_axes: unmeasured,
        // Retained for consumers that read it. Under the swept canon we quote only
        // what we measured, so quotable_axes == measured_axes by construction.
        quotable_axes: measured,
        public_count: `${selected.length} axis · ${measured} measured`,
        model_fleets: selected.filter((a: any) => a.kind === "model-comparison").length,
        fact_runs: selected.filter((a: any) => a.kind === "deterministic-facts").length,
        count_grammar:
          unmeasured === 0
            ? `${selected.length} axis are on the board and every one carries a measurement — no ` +
              `declared slot is empty. Both counts are DERIVED from the axis array, never typed; if a ` +
              `future slot is added with no run behind it, this line separates the two again on its own.`
            : `${selected.length} axis are on the board; ${measured} of them carry a measurement and ` +
              `${unmeasured} are declared slots with no run behind them. The larger number counts slots, ` +
              `the smaller counts measurements — quote both or quote the smaller. A published slot exists ` +
              `so the gap is visible; it is not evidence of anything having been measured.`,
        by_family: {
          gspc: {
            ...bySelectedFamily("gspc"),
            note: "The 14 behavioural axes: a model fleet answers a frozen bank, graded deterministically.",
          },
          financial: {
            ...bySelectedFamily("financial"),
            note: "The 8 financial/domain axis (ADR-001), all MEASURED as deterministic-facts runs — " +
              "issuer-account flags read off the public ledger (financial n=16 on the live XRPL " +
              "reader; provenance-controls n=6) and public statistical series, graded by rule with no " +
              "model, no fleet and no judgement. None of the eight is a model comparison, so none has " +
              "a leader, an accuracy or a separation determination, and none contributes to any mean " +
              "below — measured is not the same as scored. The two former index slots are measured as " +
              "component facts (ai-adoption-components, labour-components), never restored to the " +
              "retired MEASURED-INDEX-v0.1 sticker (C-2026-0826-05).",
          },
        },
        sweep_note:
          "Swept 2026-08-26 under ADR-001. The 8 financial/domain axis were ruled in on 2026-08-24 but " +
          "were absent from this payload until the sweep, so this endpoint reported 14 — the un-swept " +
          "state. All 8 now carry deterministic-facts runs, so every one of the 22 axis on the board " +
          "has a run behind it: 14 model-comparison axes and 8 deterministic-fact axes. The fact axes " +
          "carry no accuracy and no leader — measured is not the same as scored — but each has a " +
          "signed run, so the count and the evidence agree. No axis was marked MEASURED without one.",
        license: "CC-BY-4.0",
        license_note: "Board data is CC-BY-4.0 (attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai). Our own valve-2 bench-card flagged the payload's missing licence field — fixed same day.",
        items,
        items_note: "items sums each axis's n. The n of the one measured financial axis counts ISSUER " +
          "ACCOUNTS, not bank items, and declared slots contribute 0 because nothing was measured. " +
          "Read items as 'rows behind the board', not as a single comparable sample.",
        // Separation stats are over model-comparison axis ONLY — see comparison_axes.
        comparison_axes: cmp.length,
        separated_leads: cmp.filter((a) => a.separation === "SEPARATED").length,
        ties: cmp.filter((a) => a.separation === "TIE").length,
        untested_separations: cmp.filter((a) => a.separation === "UNTESTED").length,
        separation_scope_note:
          "Separation asks whether a leader's lead over a fleet is statistically real, so it applies " +
          "only to the model-comparison axes. The financial axes have no fleet and no leader: they are " +
          "not counted as untested, because no separation test is applicable to them.",
        // ── neutral-body exclusion (2026-09-01) ──────────────────────────────
        // Our own tuned council specialists are removed from the PUBLIC leader slots. These
        // counts make the effect explicit and are DERIVED from the axis array, never typed.
        externally_led_axes: externallyLedAxes.length,
        // BLUEPRINT 02Sep2026 §2.3 / BLOCK A1 — public leaders ≠ measured axes.
        // Same derivation as externally_led_axes (carded external leaders only).
        // Keep measured_axes unchanged; do not invent leaders for withheld axes.
        public_leader_count: externallyLedAxes.length,
        lid:
          `${measured} axes measured · ${cmp.length} model fleets · ${externallyLedAxes.length} public leader scores · ` +
          `${bySelectedFamily("financial").measured} fact runs · TIE is TIE · not a certificate.`,
        own_leaders_excluded: ownLedExcludedAxes.length,
        own_leaders_excluded_axes: ownLedExcludedAxes,
        own_model_exclusion_note:
          `Own council-specialist models were removed from the public per-axis leaders on ` +
          `${ownLedExcludedAxes.length} of the ${cmp.length} model-comparison axes (${ownLedExcludedAxes.join(", ") || "none"}); ` +
          `${externallyLedAxes.length} axes carry an external public leader. A neutral measurement body ` +
          `does not rank its own models against the vendors it measures. This changes leader attribution ` +
          `and the separation/mean tallies (which are over externally-led axes only), NOT measured_axes: ` +
          `every axis still carries a measurement, so the measured count is unchanged. The excluded models' ` +
          `signed cards are untouched — measurement happened; it is simply not published as a public ranking ` +
          `of our own model.`,
        // ── uncarded-leader drop (2026-09-01) ────────────────────────────────
        // External leaders with NO signed per-model card are removed from the public leader
        // slots. A named leader that cannot be linked to the Ed25519 card behind it breaks the
        // board's core promise, so it is dropped rather than asserted. Derived, never typed.
        uncarded_leaders_dropped: uncardedLeaderDroppedAxes.length,
        uncarded_leaders_dropped_axes: uncardedLeaderDroppedAxes,
        uncarded_leader_note:
          `The public per-axis leader was removed on ${uncardedLeaderDroppedAxes.length} of the ${cmp.length} ` +
          `model-comparison axes (${uncardedLeaderDroppedAxes.join(", ") || "none"}) whose named leader was an ` +
          `external model carrying NO signed per-model card in the public card index (/signed/card_index.json). ` +
          `The board's promise is that every named leader links to the Ed25519 card behind it; where no such card ` +
          `exists, no leader or accuracy is asserted rather than invented. Each of these axes stays MEASURED — the ` +
          `fleet aggregate (fleet_mean) is a real measurement — so measured_axes is unchanged; only the ` +
          `unverifiable leader claim is dropped. public_leader_state=NO_SIGNED_CARD on each. This changes leader ` +
          `attribution and the separation/mean tallies (over carded, externally-led axes only), NOT the measured ` +
          `count.`,
        mean_macro_f1: avg((a) => a.macro_f1),
        mean_accuracy: avg((a) => a.accuracy),
        mean_fleet_mean: avg((a) => a.fleet_mean),
        mean_harm: avg((a) => a.mean_harm),
        mean_unparsed_rate: avg((a) => a.unparsed_rate),
        mean_note: "Means are over MEASURED MODEL-COMPARISON axes that carry the field. mean_accuracy " +
          "averages the per-axis LEADERS; mean_fleet_mean averages each axis's measured fleet — the " +
          "difference is selection, not skill. mean_harm is the severity-weighted failure mass the mean " +
          "accuracy hides; it exists only for the measured board-v2 axes. No financial axis enters any " +
          "of these means: an axis with no accuracy contributes nothing rather than a zero.",
      };
    })(),
    bank_host: BANK_HOST,
    // Counted from the axis array immediately above, never typed. The previous wording
    // ("Every axis WITH a frozen bank carries dataset_url — the bank resolved to a
    // fetchable URL") was a blanket assertion with nothing behind it, and it was false
    // for the jail axis for as long as it stood.
    banked_axes: banked.length,
    banked_axes_resolvable: bankResolved.length,
    banked_axes_unresolvable: bankUnresolvable.map((a) => a.axis),
    bank_note:
      `${bankResolved.length} of the ${banked.length} axis carrying a frozen bank resolve to a ` +
      "dataset_url built as bank_host + the axis's bare <owner>/<name> slug, so a stranger can " +
      "retrieve the split without knowing where we host it. Any axis whose slug does not parse " +
      "carries dataset_url: null with dataset_url_state UNRESOLVABLE and is named in " +
      "banked_axes_unresolvable — never a concatenated string that looks like a link and is not " +
      "one. Both counts are derived from the axes array in this payload. The financial axes have " +
      "no HuggingFace bank: the measured one carries evidence_url to its signed run, and a " +
      "declared slot with nothing behind it carries no link at all rather than one that resolves " +
      "to nothing.",
    axes: selected.map(withResolvableBank),
    // In the payload for honesty; NOT the board. See the note on each entry.
    measured_in_lane: axis ? undefined : MEASURED_IN_LANE,
    domains: [
      {
        domain: "cross-border",
        title: "Cross-Border / East-West Bridge Governance",
        schema: "csoai.gspc-domains/cross-border/1.0",
        axes: 6,
        status: "SCAFFOLD",
        crosswalk: "/crosswalk/",
        crosswalk_v1: "/crosswalk/east-west-v1.json",
        east_west: "/east-west/",
        challenge: "/challenge/",
        card: "/signals/cross-border-card.signed.json",
        note: "One signed measurement mapped across EU/UK/US/IL/CN regimes. Scores free to verify; determination stays with authorities.",
      },
    ],
    limitations: [
      `${separatedNames.length} of the ${measuredCount} measured model-comparison axis show a statistically separated leader (McNemar p<0.05 on discordant items): ${separatedNames.join(", ") || "none"}. ${tieCount} are statistical ties — a point-estimate lead is not a measured advantage. This fraction is over the behavioural axis only; the financial axis are not model comparisons and are not in its denominator.`,
      `${selected.length} axis are on the board and ${selected.filter((a) => a.status === "MEASURED").length} carry a measurement. See totals.count_grammar. The financial-fact axis are not model comparisons — they carry no accuracy and no leader, but each is a measured deterministic-facts run.`,
      "provenance-controls plus the four 2026-09-01 issuer-disclosure mills (reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure) measure FACTS on the same six instruments. Risk verdicts stay UNMEASURED and need counsel. Not a rating, not advice, not a ranking, not an endorsement.",
      "Rail honesty on provenance-controls: the issuer facts are read from MAINNET, but the attestations are carried on DEVNET. XRPL mainnet attestation is PLANNED, not live, and nothing is attested on any Ethereum chain — the EVM-side attestation backend is NOT BUILT. Coverage is 6 of the 16 instruments the registry names; the other 10 have no locatable public issuer address and were never attested. That gap is scope, not staleness: all 6 re-verified against live mainnet with zero flag drift.",
      "C-2026-0826-05 stands: MEASURED-INDEX-v0.1 was an over-claim. Those slots are now component-fact objects (ai-adoption-components, labour-components), not indexes. Do not restore the v0.1 sticker.",
      "Jail (slot 14) separation determination 2026-08-25: TIE — the leader's Wilson 95% interval [0.475, 0.698] contains the fleet mean 0.5455, so the point-estimate lead is not a measured advantage. Measured on a 7-model gold-bank fleet (all models n≥30 usable, 68–71), not the 19-model board fleet; the gold bank is published (csoai/gspc-jail-goldbank, HF 2026-08-25).",
      "jail's fleet accuracy 0.5455 is the mean of per-model accuracies across 7 models x 71 gold cells (usable n 68–71); the leader accuracy 0.5915 is the best zero-false-positive detector's (tp+tn)/71. Best precision 1.0, best recall 0.237 — the best detector still misses 3 of 4 escapes.",
      "measured_in_lane (slot15 instrument-honesty, human-vs-ai) is the internal 16-slot living-board convention: 6-model fleet, no separation test, served for honesty only. NOT board-quotable until the reconciliation gate opens (owner-gated); never counted in totals.",
      "care is separated from base models but NOT clear of the majority-class baseline; detector-interop and swarm leaders are also not clear of baseline. Quote accordingly.",
      "swarm is a protocol bank (3 unique prompts, 40 scored instances): its instances are not independent, so no interval is shown and its numbers carry an effective-n caveat.",
      "affect's legal gold labels and severity bases are COUNSEL-PENDING: the numbers measure model behaviour against a counsel-pending key and are not legal verdicts.",
      "Scores describe measured runs on frozen splits on a date. They do not describe a system's compliance with anything.",
      "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body.",
    ],
  };

  // ── site attestation ────────────────────────────────────────
  // Sign the served board snapshot at the edge with the dedicated board key
  // (#board-attestation-1, provisioned as a Cloudflare secret; its public half
  // is published in did.json). This attests INTEGRITY of THIS payload as
  // published by the site — a stranger can fetch the board, fetch did.json, and
  // verify without trusting us. It is NOT the pod measurement-chain signature
  // (living_stamp, above) and claims nothing about re-running the measurement.
  // No key → no attestation field: honest absence, never a fabricated signature.
  const b64 = (context.env as { BOARD_SIGN_KEY_PKCS8_B64?: string })?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical = (o: unknown): string => {
        if (o === null || typeof o !== "object") return JSON.stringify(o);
        if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
        const r = o as Record<string, unknown>;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
      };
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;

      // New living stamp: one key (DID-pinned #board-attestation-1), one signature,
      // sufficient preimage. UNMEASURED n is null. The 2026-08-18 stamp is kept
      // under `superseded` — it stays UNVERIFIABLE; this does not paint it VALID.
      const livingPreimage = {
        schema: "csoai.gspc-living/0.2",
        gold_run: "2026-08-18T03:22:16Z",
        source: "boards-v2 + gold-run-3090; axis roster of this deploy (not a live re-fetch)",
        // Own council leaders excluded here too, and uncarded external leaders dropped, so no
        // public surface of this payload — the stamp included — names a leader (or its accuracy)
        // that we cannot back: neither our own model on an axis it topped, nor an external model
        // with no signed card.
        axes: AXES.map(excludeOwnLeader).map(dropUncardedLeader).map((a) => ({
          axis: a.axis,
          family: a.family,
          kind: a.kind,
          status: a.status,
          n: a.status === "MEASURED" ? a.n : null,
          accuracy: a.status === "MEASURED" && typeof a.accuracy === "number" ? a.accuracy : null,
          separation: a.separation ?? null,
        })),
      };
      const livingBytes = canonical(livingPreimage);
      const livingSig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(livingBytes)));
      measuredOn.living_stamp = {
        schema: "csoai.gspc-living/0.2",
        gold_run: livingPreimage.gold_run,
        source: livingPreimage.source,
        signed: true,
        signer: "did:web:csoai.org#board-attestation-1",
        signer_anchored: true,
        alg: "Ed25519",
        signature: livingSig,
        public_key_x: jwk.x,
        preimage: livingPreimage,
        sig_input:
          "Ed25519 over the RAW UTF-8 BYTES (not a digest) of canonical JSON of the `preimage` " +
          "object only ({schema, gold_run, source, axes}). Canonical JSON: object keys sorted by " +
          "code point, recursively; no whitespace (separators ',' and ':'); non-ASCII emitted " +
          "LITERALLY as UTF-8 (ensure_ascii=False); numbers by ECMAScript Number::toString " +
          "(integral float renders 0, not 0.0). Envelope fields (signature, public_key_x, " +
          "sig_input, signer, signed, signer_anchored, alg, verification_state, verifiable, " +
          "superseded, tracked_as, verify) are NOT in the preimage.",
        sig_input_ensure_ascii: false,
        sig_input_is_digest: false,
        verification_state: "SIGNED",
        verifiable: true,
        verify:
          "fetch https://csoai.org/.well-known/did.json → #board-attestation-1 → Ed25519-verify " +
          "`signature` over the raw UTF-8 bytes of canonical(`preimage`), ensure_ascii=False",
        superseded: MEASURED_ON.living_stamp,
        tracked_as: "/api/corrections C-2026-0826-08",
      } as typeof measuredOn.living_stamp;

      const signedBytes = canonical(body); // body WITHOUT site_attestation — reconstructable by anyone
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      (body as Record<string, unknown>).site_attestation = {
        attests: "integrity of this board snapshot as published by the site (NOT a re-measurement)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        // The public key is echoed for transparency, but a stranger anchors trust
        // on the SAME key as published independently in /.well-known/did.json — the
        // payload never vouches for its own key.
        public_key_x: jwk.x,
        // BE EXACT ABOUT THE BYTES. "canonical JSON" alone is not a preimage rule:
        // an implementer's first reading in a Python-flavoured estate is
        // json.dumps(sort_keys=True, separators=(',',':')), whose default is
        // ensure_ascii=True — and that FAILS here, because this payload carries 81
        // non-ASCII code points (· × – — → ≥) and the signer emits them literally.
        // The two readings differ by ~256 bytes, so a correct implementer reports a
        // bad signature on a good artefact (outside audit A2, 2026-08-26). The bytes
        // are not changed to suit the description; the description is made exact.
        //
        // NOTE THE CARDS ARE DIFFERENT AND MUST STAY DIFFERENT. The 150 measurement
        // cards under /signed/cards/ were minted with ensure_ascii=TRUE (each card
        // states so in its own `preimage` field), and their ids are SHA-256 over
        // exactly those bytes. This board is signed with ensure_ascii=FALSE. Neither
        // can be "harmonised" to the other without invalidating signatures over bytes
        // that already exist, so both rules are stated wherever each is published.
        sig_input:
          "Ed25519 over the RAW UTF-8 BYTES (not a digest) of canonical JSON of this payload " +
          "with the site_attestation field removed. Canonical JSON here means: object keys " +
          "sorted by code point, recursively; no whitespace (separators ',' and ':'); non-ASCII " +
          "emitted LITERALLY as UTF-8, never as \\uXXXX escapes (Python ensure_ascii=FALSE — " +
          "ensure_ascii=True is the wrong reading and will fail, this payload contains non-ASCII " +
          "characters); numbers serialised by ECMAScript Number::toString, so an integral float " +
          "renders 0, not 0.0. This is NOT the rule used by the signed measurement cards under " +
          "/signed/cards/, which were minted with ensure_ascii=TRUE and whose ids are SHA-256 " +
          "over those bytes — see /signed/HOW-TO-VERIFY.md. The two are deliberately different " +
          "and are each signed over the bytes they were signed over.",
        sig_input_ensure_ascii: false,
        sig_input_is_digest: false,
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → verify sig over the raw UTF-8 bytes of canonical(payload minus site_attestation), with ensure_ascii=False as specified in sig_input",
      };
    } catch {
      // A provisioned-but-broken key must not degrade to a fake pass: omit the
      // field and surface the operational fault in the payload instead.
      (body as Record<string, unknown>).site_attestation = { error: "board signing key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
