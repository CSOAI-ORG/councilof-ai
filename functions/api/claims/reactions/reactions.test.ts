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

  it.each(["CORRECTED", "QUARANTINED"])("rechecks a signed %s event without losing its receipt state", (change_state) => {
    const [r] = deriveClaimReactions([
      line({ seq: 0, kind: "event", object_state: "SIGNED", change_state }),
    ]);
    expect(r.reaction_state).toBe("RECHECK_REQUIRED");
    expect(r.receipt_state).toBe("DELIVERY_RECEIPT");
    expect(r.event_state).toBe(change_state);
    expect(r.counter_reaction.required).toBe(true);
    expect(r.recommended_checks).not.toHaveLength(0);
  });

  it("rechecks a signed recorded-state transition after an exclusive cursor", () => {
    const [r] = deriveClaimReactions([
      line({ seq: 0, subject_sealed_id: "s1", claim: "c1", recorded_state: "CLAIM_MEASURED" }),
      line({ seq: 1, subject_sealed_id: "s1", claim: "c1", object_state: "SIGNED", recorded_state: "UNMEASURED" }),
    ], 0);
    expect(r.reaction_state).toBe("RECHECK_REQUIRED");
    expect(r.receipt_state).toBe("DELIVERY_RECEIPT");
    expect(r.reason).toContain("CLAIM_MEASURED to UNMEASURED");
  });

  it.each([
    { kind: "source_not_reachable_this_run", object_state: "SIGNED" },
    { kind: "event", object_state: "SIGNED", change_state: "UNCONFIRMED" },
    { kind: "event", object_state: "FETCH_FAILED", change_state: "CONFIRMED" },
  ])("keeps an incomplete source read out of change evidence: %j", (fields) => {
    const [r] = deriveClaimReactions([
      line({ seq: 0, ...fields }),
    ]);
    expect(r.reaction_state).toBe("SOURCE_RETRY_REQUIRED");
    expect(r.counter_reaction.required).toBe(true);
    expect(r.reason).not.toMatch(/claim state changed/);
    expect(r.receipt_state).toBe(fields.object_state === "SIGNED" ? "DELIVERY_RECEIPT" : null);
  });

  it("does not replace the prior recorded state with an incomplete read", () => {
    const r = deriveClaimReactions([
      line({ seq: 0, subject_sealed_id: "s1", claim: "c1", recorded_state: "CLAIM_MEASURED" }),
      line({ seq: 1, subject_sealed_id: "s1", claim: "c1", kind: "source_not_reachable_this_run", recorded_state: "UNMEASURED" }),
      line({ seq: 2, subject_sealed_id: "s1", claim: "c1", change_state: "CONFIRMED", recorded_state: "CLAIM_MEASURED" }),
    ]);
    expect(r[1].reaction_state).toBe("SOURCE_RETRY_REQUIRED");
    expect(r[2].reaction_state).toBe("NO_CHANGE");
  });

  it("requires review when declared checks fail, even on a signed confirmation", () => {
    const [r] = deriveClaimReactions([
      line({ seq: 0, object_state: "SIGNED", change_state: "CONFIRMED", checks_all_pass: false }),
    ]);
    expect(r.reaction_state).toBe("RECHECK_REQUIRED");
    expect(r.receipt_state).toBe("DELIVERY_RECEIPT");
    expect(r.counter_reaction.required).toBe(true);
    expect(r.reason).toContain("checks did not reproduce");
  });

  it.each([true, undefined, "false"])("does not infer a failed check from %j", (checks_all_pass) => {
    const [r] = deriveClaimReactions([
      line({ seq: 0, change_state: "CONFIRMED", recorded_state: "CLAIM_MEASURED", checks_all_pass }),
    ]);
    expect(r.reaction_state).toBe("NO_CHANGE");
    expect(r.counter_reaction.required).toBe(false);
    expect(r.receipt_state).toBeNull();
  });

  it("retains ordinary signed-confirmation and baseline semantics", () => {
    const r = deriveClaimReactions([
      line({ seq: 0, kind: "atoms", baseline: true }),
      line({ seq: 1, object_state: "SIGNED", change_state: "CONFIRMED", checks_all_pass: true }),
    ]);
    expect(r.map((x) => x.reaction_state)).toEqual(["BASELINE_ONLY", "DELIVERY_RECEIPT"]);
    expect(r.map((x) => x.receipt_state)).toEqual([null, "DELIVERY_RECEIPT"]);
    expect(reactionSummary(r).n_counter_reaction_required).toBe(0);
  });
});
