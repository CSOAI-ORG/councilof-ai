import INDEX from "../../../public/axis-specialists/index.json";
import { canonicalBytes, sha256Hex } from "../../../functions/_lib/cardSign";
import { HITL_CHALLENGE_SCHEMA, HITL_POLICY, verifyChallenge, type HitlChallenge } from "../../../functions/api/_hitl";
import type { AxisSpecialistAudit } from "../components/gspc/CouncilAxisSpecialistPane";
import { requestHitlJson } from "./hitlRequest";

/** Match the generated build pin and recompute the body and row. This is content
 * integrity against this build, not a signature or verification of source claims. */
export async function verifyPinnedSpecialist(audit: AxisSpecialistAudit): Promise<void> {
  const pin = INDEX.specialists.find(row => row.axis === audit.axis);
  const { audit_sha256, ...body } = audit;
  if (!pin || audit_sha256 !== pin.audit_sha256 ||
      await sha256Hex(canonicalBytes(body)) !== pin.audit_sha256 ||
      await sha256Hex(canonicalBytes(audit.source.axis_row)) !== audit.source.axis_row_sha256 ||
      audit.charter.sha256 !== INDEX.charter.sha256 || audit.charter.version !== INDEX.charter.version ||
      audit.charter.mapping_kind !== INDEX.charter.mapping_kind ||
      JSON.stringify(audit.charter.articles.map(a => a.article)) !== JSON.stringify(pin.charter_articles)) {
    throw new Error("Audit content differs from this application's pinned version. Reload the page; do not review mixed versions.");
  }
}

export type AxisReviewRequest = { axis: string; subject: string; proposed_action: string; raised_by: string; source: string; facts: string };
export async function axisReviewRequest(audit: AxisSpecialistAudit, proposalId: string): Promise<AxisReviewRequest> {
  await verifyPinnedSpecialist(audit);
  const proposal = audit.improvement_proposals.find(row => row.id === proposalId);
  if (!proposal || proposal.state !== "PROPOSED_NOT_APPLIED" || !proposal.requires_human_approval) throw new Error("Choose a proposal from this audit.");
  return {
    axis: audit.axis, subject: `Review ${audit.axis}: ${proposal.id}`,
    proposed_action: `Review only: ${proposal.proposal}\nAudit SHA-256: ${audit.audit_sha256}\nCharter ${audit.charter.version} SHA-256: ${audit.charter.sha256}\nThis request does not authorize execution, signing, publication or measurement admission.`,
    raised_by: "axis-specialist-reader",
    source: `https://councilof.ai/axis-specialists/${audit.axis}.json`,
    facts: `Snapshot: ${audit.source.snapshot}\nMeasurement status in that snapshot: ${audit.source.axis_row.status}\nReviewer role required: ${audit.human_gate.reviewer_role}\nMapped charter articles: ${audit.charter.articles.map(item => item.article).join(", ")}\nAxis row SHA-256: ${audit.source.axis_row_sha256}\nProposal: ${proposal.id}\nThe audit and charter digests are in the proposed action. A role description does not appoint a reviewer.`,
  };
}

export async function acceptReviewChallenge(value: unknown, expected: AxisReviewRequest): Promise<HitlChallenge & { stored: boolean }> {
  const item = value as HitlChallenge & { stored: boolean; decision?: unknown; execution_authority?: unknown };
  if (!item || item.schema !== HITL_CHALLENGE_SCHEMA || item.policy !== HITL_POLICY ||
      typeof item.id !== "string" || typeof item.at !== "string" || !Number.isFinite(Date.parse(item.at)) ||
      typeof item.stored !== "boolean" || item.required_module !== null ||
      item.decision !== undefined || item.execution_authority !== undefined ||
      Object.entries(expected).some(([key, val]) => item[key as keyof HitlChallenge] !== val) ||
      !await verifyChallenge(item)) {
    throw new Error("The returned review does not match the submitted proposal. Its outcome is unconfirmed; inspect the review queue before sending again.");
  }
  return item;
}

/** One explicit write, never a retry. A failure may follow a successful write. */
export async function submitAxisReview(input: AxisReviewRequest, send = requestHitlJson) {
  const { response, body } = await send("/api/hitl/challenge", {
    method: "POST", credentials: "omit", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  });
  if (response.status !== 201) throw new Error("Review submission was not confirmed. Inspect the review queue before sending again.");
  return acceptReviewChallenge(body, input);
}
