/**
 * Deterministic Claim Maintenance reaction/counter-reaction projection.
 * Input is ONLY the already verified public claim-event feed.
 */
export const REACTION_SCHEMA = "csoai.claim-reactions/0.1" as const;

type Row = Record<string, unknown>;
export type ReactionState =
  | "NO_CHANGE"
  | "RECHECK_REQUIRED"
  | "SOURCE_RETRY_REQUIRED"
  | "DELIVERY_RECEIPT"
  | "BASELINE_ONLY";

export type ClaimReaction = {
  event_seq: number;
  observed_at: string | null;
  subject_sealed_id: string | null;
  claim_ref: string | null;
  event_state: string | null;
  evidence_freshness: "NOT_EVALUATED";
  reaction_state: ReactionState;
  reason: string;
  recommended_checks: string[];
  counter_reaction: { required: boolean; checks: string[]; boundary: string };
};

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

function planFor(row: Row, previousRecorded: string | undefined): ClaimReaction {
  const seq = Number.isInteger(row.seq) ? Number(row.seq) : -1;
  const change = str(row.change_state);
  const objectState = str(row.object_state);
  const recorded = str(row.recorded_state);
  const kind = str(row.kind);

  let reaction_state: ReactionState = "NO_CHANGE";
  let reason = "No re-check trigger is recorded. This is not a claim that the evidence is fresh.";

  // Correction and withdrawal must outrank SIGNED: a signature is delivery integrity,
  // not permission to suppress a later correction/review signal.
  if (kind === "atoms" && row.baseline === true) {
    reaction_state = "BASELINE_ONLY";
    reason = "This atoms event establishes a baseline; a baseline is not evidence of a later change.";
  } else if (
    change === "CORRECTED" ||
    change === "QUARANTINED" ||
    change === "WITHDRAWN" ||
    (recorded && previousRecorded !== undefined && recorded !== previousRecorded)
  ) {
    reaction_state = "RECHECK_REQUIRED";
    reason = change === "CORRECTED" || change === "QUARANTINED" || change === "WITHDRAWN"
      ? `The event change_state is ${change}; affected dependencies require bounded re-verification.`
      : `The recorded claim state changed from ${previousRecorded} to ${recorded}; affected dependencies require bounded re-verification.`;
  } else if (objectState === "FETCH_FAILED" || change === "UNCONFIRMED" || objectState === "UNCONFIRMED") {
    reaction_state = "SOURCE_RETRY_REQUIRED";
    reason = "The source observation did not complete strongly enough to support a change finding.";
  } else if (objectState === "SIGNED") {
    reaction_state = "DELIVERY_RECEIPT";
    reason = "The event records a signed delivery state; signing is a receipt, not a new finding.";
  }

  const challenge = reaction_state === "RECHECK_REQUIRED" || reaction_state === "SOURCE_RETRY_REQUIRED";
  return {
    event_seq: seq,
    observed_at: str(row.at),
    subject_sealed_id: str(row.subject_sealed_id),
    claim_ref: str(row.claim),
    event_state: change ?? objectState,
    evidence_freshness: "NOT_EVALUATED",
    reaction_state,
    reason,
    recommended_checks: challenge
      ? [
          "verify the public claim-event feed and signed head still verify",
          "re-read the same public source with the same extractor before interpreting a digest difference",
          "recompute affected dependency atoms only",
        ]
      : [],
    counter_reaction: {
      required: challenge,
      checks: challenge
        ? [
            "repeat the source read independently where feasible",
            "compare against the prior captured bytes and access time",
            "look for an independent public evidence source if the claim is settleable",
            "preserve conflicting or insufficient evidence instead of forcing a verdict",
          ]
        : [],
      boundary: "Counter-reaction challenges the proposed re-check path; it does not decide whether the maintained claim is true or false.",
    },
  };
}

export function deriveClaimReactions(lines: string[], since = -1): ClaimReaction[] {
  const previous = new Map<string, string>();
  const out: ClaimReaction[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Row;
    const claim = str(row.claim);
    const subject = str(row.subject_sealed_id);
    const recorded = str(row.recorded_state);
    const key = claim && claim !== "*" ? `${subject ?? "unknown"}:${claim}` : null;
    const prior = key ? previous.get(key) : undefined;
    const seq = Number.isInteger(row.seq) ? Number(row.seq) : -1;
    if (seq > since) out.push(planFor(row, prior));
    if (key && recorded) previous.set(key, recorded);
  }
  return out;
}

export function reactionSummary(reactions: ClaimReaction[]) {
  const by_state: Record<string, number> = {};
  for (const r of reactions) by_state[r.reaction_state] = (by_state[r.reaction_state] ?? 0) + 1;
  return {
    n_events: reactions.length,
    by_state,
    n_counter_reaction_required: reactions.filter((r) => r.counter_reaction.required).length,
  };
}
