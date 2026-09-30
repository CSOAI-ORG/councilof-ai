/**
 * GSPC Route: the decision (spec §4.2). Routing is not ranking.
 *
 *  1. Every candidate the policy forbids is dropped; the drop is kept with its policy id.
 *  2. The quality axis is read from the live board. A candidate the board holds no number for is
 *     UNTESTED: never imputed, never 0.
 *  3. If the board SEPARATED its top row from the next best, and that model is a permitted candidate,
 *     the router may name it "separated leader" (functions/_lib/leaderLabel.ts). Anything else is TIE
 *     or UNTESTED, and the CALLER's tie_break decides; the output says choice_basis "tie_break:<rule>".
 *
 * No field that carries money is an input here: candidates.ts drops them before this file sees a
 * candidate, and the tie-break reads only declared cost, locality and id.
 */
import { isSeparated, leaderLabel } from "../leaderLabel";
import { evaluate, type CallerPolicy, type CandidateFacts, type PolicyContext } from "./policy";
import type { BoardAxis, Candidate, Measurement, Objective, PolicyVerdict, Separation, TieBreakRule } from "./types";

/** "mistral:7b (base model)" -> "mistral:7b". Case-insensitive match key. */
export function modelKey(s: string | null | undefined): string {
  return String(s ?? "").replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();
}

/** The one measurement the board holds for this candidate on this axis, or UNTESTED. */
export function measurementFor(c: Candidate, axis: BoardAxis | null, axisName: string | null): Measurement | null {
  if (!axisName) return null;
  const untested: Measurement = {
    axis: axisName,
    state: "UNTESTED",
    value: null,
    interval: null,
    n: null,
    source: axis?.source ?? null,
    source_sha256: axis?.source_sha256 ?? null,
    label: null,
  };
  if (!axis || !c.model) return untested;
  const key = modelKey(c.model);
  for (const row of [axis.leader, axis.next_best]) {
    if (row && modelKey(row.model) === key && typeof row.accuracy === "number") {
      return {
        axis: axis.axis,
        state: "MEASURED",
        value: row.accuracy,
        interval: row.wilson95,
        n: row.n,
        source: axis.source,
        source_sha256: axis.source_sha256,
        // Set by decide() once the separation of THIS choice is known; only leaderLabel() writes it.
        label: null,
      };
    }
  }
  return untested;
}

export type Considered = {
  candidate: Candidate;
  verdict: PolicyVerdict;
  measurement: Measurement | null;
};

export type Decision = {
  considered: Considered[];
  permitted: string[];
  chosen: { id: string; choice_basis: string } | null;
  separation: Separation;
  label: string | null;
  tie_break_applied: TieBreakRule[] | null;
};

function tieBreak(cands: Candidate[], rules: TieBreakRule[]): Candidate[] {
  const key = (a: Candidate, b: Candidate, r: TieBreakRule): number => {
    if (r === "cheapest_declared") {
      // A candidate with no declared cost sorts after every declared one; it is not assumed free.
      const x = a.cost_declared ?? Number.POSITIVE_INFINITY;
      const y = b.cost_declared ?? Number.POSITIVE_INFINITY;
      return x === y ? 0 : x < y ? -1 : 1;
    }
    if (r === "local_first") return a.local === b.local ? 0 : a.local ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
  // lexical_id always closes the order, so the result is total and deterministic.
  const chain: TieBreakRule[] = rules.includes("lexical_id") ? rules : [...rules, "lexical_id"];
  return [...cands].sort((a, b) => {
    for (const r of chain) {
      const k = key(a, b, r);
      if (k) return k;
    }
    return 0;
  });
}

export function decide(
  candidates: Candidate[],
  policy: CallerPolicy,
  ctx: PolicyContext,
  objective: Objective,
  axis: BoardAxis | null,
): Decision {
  const considered: Considered[] = candidates.map((candidate) => {
    const measurement = measurementFor(candidate, axis, objective.quality_axis);
    const facts: CandidateFacts = { measured_on_axis: measurement?.state === "MEASURED" };
    return { candidate, measurement, verdict: evaluate(candidate, facts, policy, ctx) };
  });
  const permitted = considered.filter((x) => x.verdict.permit);
  const measured = permitted.filter((x) => x.measurement?.state === "MEASURED");

  // Separation is a property of the board's comparison, and it applies to THIS choice only when the
  // board's separated top row is itself among the permitted candidates.
  let separation: Separation = "UNTESTED";
  let chosen: Decision["chosen"] = null;
  let label: string | null = null;
  let tie_break_applied: TieBreakRule[] | null = null;

  const qualityWanted = objective.quality_axis !== null && objective.weights.quality > 0;
  const topModel = axis?.leader ? modelKey(axis.leader.model) : null;
  const separatedTop =
    qualityWanted && axis && isSeparated(axis.separation) && topModel
      ? permitted.find((x) => x.candidate.model && modelKey(x.candidate.model) === topModel)
      : undefined;

  if (separatedTop) {
    separation = "SEPARATED";
    label = leaderLabel("SEPARATED");
    chosen = { id: separatedTop.candidate.id, choice_basis: `separated_leader:${axis!.axis}` };
  } else {
    separation = measured.length >= 2 ? "TIE" : "UNTESTED";
    label = measured.length ? leaderLabel(separation) : null;
    if (permitted.length === 1) {
      chosen = { id: permitted[0].candidate.id, choice_basis: "only_permitted" };
    } else if (permitted.length > 1) {
      tie_break_applied = objective.tie_break;
      const order = tieBreak(permitted.map((x) => x.candidate), objective.tie_break);
      chosen = { id: order[0].id, choice_basis: `tie_break:${objective.tie_break.join(">")}` };
    }
  }
  // Only the board's top row carries a label, written by leaderLabel() from the separation of THIS
  // choice: a separated board row whose model was forbidden does not make the choice separated.
  for (const x of considered)
    if (x.measurement?.state === "MEASURED" && topModel && x.candidate.model && modelKey(x.candidate.model) === topModel)
      x.measurement.label = leaderLabel(separation);
  return {
    considered,
    permitted: permitted.map((x) => x.candidate.id),
    chosen,
    separation,
    label,
    tie_break_applied,
  };
}
