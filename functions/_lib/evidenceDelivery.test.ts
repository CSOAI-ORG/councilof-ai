import { describe, expect, it } from "vitest";
import { evidenceDeliveryInput } from "./__fixtures__/evidenceDelivery";
import { evidenceDeliveryMessage, validateEvidenceDeliveryInput } from "./evidenceDelivery";

describe("Council Evidence Delivery adapter", () => {
  it("accepts a reviewed unsigned local draft and returns a Message with explicit non-claims", () => {
    const input = evidenceDeliveryInput();
    expect(validateEvidenceDeliveryInput(input)).toBeNull();
    const result = evidenceDeliveryMessage(input, "reply-1", "context-1");
    expect(result.message).toMatchObject({ messageId: "reply-1", contextId: "context-1", role: "ROLE_AGENT" });
    expect(result.message.parts[1].data).toMatchObject({
      receipt_id: input.draft.receipt_id,
      local_claim_state: "LOCAL_DRAFT_REVIEWED",
      human_review_decision: "approve",
      council_measurement_performed: false,
      source_digest_recomputed: false,
      signed: false,
      anchored: false,
      certification: false,
      adapter_storage_performed: false,
      source_bytes_received: false,
    });
    expect(result.message.parts[0].text).toContain("not received or re-hashed");
  });

  it.each([
    ["certification", (draft: any) => { draft.certification = true; }, "certification"],
    ["independent measurement", (draft: any) => { draft.measurement_state = "MEASURED"; }, "independent measurement"],
    ["an extra ignored input key", (_draft: any, input: any) => { input.extra = true; }, "exactly draft"],
    ["equal control digests", (draft: any) => { draft.evidence.negative_control_sha256 = draft.evidence.input_sha256; }, "diverge"],
    ["a missing reviewer", (draft: any) => { draft.meok_him.reviewer = ""; }, "Named MEOK H.I.M."],
    ["missing review notes", (draft: any) => { draft.meok_him.review_notes = ""; }, "review notes"],
    ["a contradictory claim state", (draft: any) => { draft.claim_state = "LOCAL_DRAFT_REJECTED"; }, "does not match"],
    ["continuous monitoring", (draft: any) => { draft.claim_boundary.continuous_watch = true; }, "no-continuous-watch"],
  ])("rejects %s", (_name, mutate, expected) => {
    const input = evidenceDeliveryInput();
    mutate(input.draft, input);
    expect(validateEvidenceDeliveryInput(input)).toContain(expected);
  });

  it.each(["changes", "reject"])("preserves the %s human decision without converting it to approval", (review_decision) => {
    const input = evidenceDeliveryInput();
    input.draft.meok_him.review_decision = review_decision;
    input.draft.claim_state = review_decision === "changes" ? "LOCAL_DRAFT_CHANGES_REQUIRED" : "LOCAL_DRAFT_REJECTED";
    const result = evidenceDeliveryMessage(input, "reply-2", "context-2");
    expect(result.message.parts[1].data).toMatchObject({ human_review_decision: review_decision, local_claim_state: input.draft.claim_state });
  });
});
