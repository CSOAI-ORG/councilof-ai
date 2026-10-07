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
import { PAID_FLOOR, PAID_NEXT, TASK_MATCH_METHOD, type TaskMatch } from "./taskMatch";

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
  /** Set only when the candidates are the GSPC tool fleet (no caller candidates): how the request matched a tool's purpose. */
  task_match: TaskMatch | null;
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
  /**
   * Task-to-tool scores (taskMatch.ts), passed only for the default GSPC tool fleet. With scores, the
   * choice is the permitted tool whose purpose matches the request; when none matches, nothing is
   * chosen (UNTESTED). The tie-break orders only tools with the same score, never the whole fleet.
   * `null` with taskText absent means the caller sent only task_sha256: nothing can be matched.
   */
  relevance: Map<string, number> | null = null,
  relevanceReadable = true,
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
  let task_match: TaskMatch | null = null;

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
    if (relevance) {
      const scored = considered
        .map((x) => ({ x, s: relevance.get(x.candidate.id) ?? 0 }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s || (a.x.candidate.id < b.x.candidate.id ? -1 : 1));
      const topAll = scored.length ? scored[0].s : 0;
      const topPermitted = scored.filter((r) => r.x.verdict.permit);
      const top = topPermitted.length ? topPermitted[0].s : 0;
      let state: TaskMatch["state"] = "UNTESTED";
      let paid: TaskMatch["paid"];
      let reason = relevanceReadable
        ? "No tool's purpose matches this request, so no tool was chosen. Nothing is picked by name order."
        : "Only task_sha256 was sent: the request text is needed to match a tool's purpose, so no tool was chosen.";
      if (top > 0 && top >= topAll) {
        state = "MATCHED";
        reason = "The chosen tool's purpose matches the request (its purpose patterns, then its description words).";
        const tied = topPermitted.filter((r) => r.s === top).map((r) => r.x.candidate);
        if (tied.length === 1) chosen = { id: tied[0].id, choice_basis: "task_match" };
        else {
          tie_break_applied = objective.tie_break;
          const order = tieBreak(tied, objective.tie_break);
          chosen = { id: order[0].id, choice_basis: `task_match>tie_break:${objective.tie_break.join(">")}` };
        }
      } else if (topAll > 0) {
        state = "MATCHED_FORBIDDEN";
        const top0 = scored[0].x;
        const tool = top0.candidate.tool ?? null;
        if (top0.verdict.forbid_policy === PAID_FLOOR && top0.candidate.paid && tool && PAID_NEXT[tool]) {
          // The caller set no policy: the floor holds every paid tool back until a wallet is declared.
          paid = { id: top0.candidate.id, tool, ...PAID_NEXT[tool] };
          reason =
            `The request matches ${tool}, a paid check (x402). A paid check runs only when you pay from your own ` +
            "wallet (policy.caller_wallet: true), so nothing was chosen, called or charged.";
        } else {
          reason = `The tool whose purpose matches this request is forbidden by the policy (${top0.verdict.forbid_policy}), so no tool was chosen.`;
        }
      }
      task_match = {
        state,
        basis: "tool_purpose",
        reason,
        matched: scored.slice(0, 5).map((r) => ({
          id: r.x.candidate.id,
          score: r.s,
          permit: r.x.verdict.permit,
          forbid_policy: r.x.verdict.forbid_policy,
        })),
        method: TASK_MATCH_METHOD,
        ...(paid ? { paid } : {}),
      };
    } else if (permitted.length === 1) {
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
    task_match,
  };
}
