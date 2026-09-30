import { describe, expect, it } from "vitest";
import { deriveClaimReactions, reactionSummary } from "../../../_lib/claimReactions";

const line = (o: Record<string, unknown>) =>
  JSON.stringify({ schema: "csoai.claim-event/0.1", ...o });

describe("claim reaction projection", () => {
  it("does not turn confirmation into a finding or an action", () => {
    const [r] = deriveClaimReactions([
      line({
        seq: 0,
        at: "2026-09-30T00:00:00Z",
        kind: "event",
        subject_sealed_id: "s1",
        claim: "c1",
        change_state: "CONFIRMED",
        recorded_state: "CLAIM_MEASURED",
      }),
    ]);
    expect(r.reaction_state).toBe("NO_CHANGE");
    expect(r.counter_reaction.required).toBe(false);
  });

  it("turns a recorded state transition into a bounded recheck plus counter-reaction", () => {
    const rows = [
      line({ seq: 0, kind: "event", subject_sealed_id: "s1", claim: "c1", recorded_state: "CLAIM_CAPTURED" }),
      line({ seq: 1, kind: "event", subject_sealed_id: "s1", claim: "c1", recorded_state: "UNMEASURED" }),
    ];
    const r = deriveClaimReactions(rows)[1];
    expect(r.reaction_state).toBe("RECHECK_REQUIRED");
    expect(r.counter_reaction.required).toBe(true);
    expect(r.counter_reaction.boundary).toMatch(/does not decide/);
  });

  it("keeps source failure separate from change evidence", () => {
    const [r] = deriveClaimReactions([
      line({ seq: 0, kind: "event", subject_sealed_id: "s1", claim: "c1", object_state: "FETCH_FAILED" }),
    ]);
    expect(r.reaction_state).toBe("SOURCE_RETRY_REQUIRED");
  });

  it("labels baseline and signed receipt without escalating them", () => {
    const r = deriveClaimReactions([
      line({ seq: 0, kind: "atoms", baseline: true, subject_sealed_id: "s1" }),
      line({ seq: 1, kind: "event", subject_sealed_id: "s1", claim: "*", object_state: "SIGNED" }),
    ]);
    expect(r.map((x) => x.reaction_state)).toEqual(["BASELINE_ONLY", "DELIVERY_RECEIPT"]);
    expect(reactionSummary(r).n_counter_reaction_required).toBe(0);
  });

  it("supports an exclusive sequence cursor while replaying prior state", () => {
    const r = deriveClaimReactions(
      [
        line({ seq: 0, kind: "event", subject_sealed_id: "s1", claim: "c1", recorded_state: "CLAIM_CAPTURED" }),
        line({ seq: 1, kind: "event", subject_sealed_id: "s1", claim: "c1", recorded_state: "CLAIM_MEASURED" }),
      ],
      0,
    );
    expect(r).toHaveLength(1);
    expect(r[0].event_seq).toBe(1);
    expect(r[0].reaction_state).toBe("RECHECK_REQUIRED");
  });
});
