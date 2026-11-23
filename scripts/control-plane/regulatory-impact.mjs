// SPDX-License-Identifier: MIT
// Read-only impact candidates for the existing daily-mapping-review-queue contract.
// This code makes no legal determination, updates no GSPC axis and contacts no reviewer.
const DIGEST = /^[a-f0-9]{64}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
function dayMs(value) {
  if (typeof value !== "string" || !DAY.test(value)) return null;
  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : null;
}
function deadlineState(deadline, asOf) {
  const end = dayMs(deadline);
  if (end === null) return { state: "DEADLINE_NOT_VERIFIED", days_remaining: null };
  const days = Math.ceil((end - asOf) / 86400000);
  return {
    state: days < 0 ? "PAST_DATE_REVIEW" : days <= 30 ? "WITHIN_30_DAYS_REVIEW" : "FUTURE_DATE_REVIEW",
    days_remaining: days,
  };
}
export function triageRegulatoryQueue(queue, options = {}) {
  if (queue?.schema !== "csoai.daily-mapping-review-queue/0.1" || !Array.isArray(queue.items))
    throw new Error("expected existing daily mapping review queue; refusing unknown schema");
  if (!DIGEST.test(queue.report_sha256 ?? "") || !DIGEST.test(queue.crosswalk_sha256 ?? ""))
    throw new Error("missing exact upstream hashes");
  const asOf = dayMs(options.asOf ?? new Date().toISOString().slice(0, 10));
  if (asOf === null) throw new Error("invalid asOf date");
  const deadlines = options.reviewedDeadlines ?? [];
  if (!Array.isArray(deadlines)) throw new Error("reviewedDeadlines must be an array");
  const byEvent = new Map();
  for (const d of deadlines) {
    if (!DIGEST.test(d.event_sha256 ?? "") || !DAY.test(d.effective_date ?? "") || dayMs(d.effective_date) === null)
      throw new Error("malformed deadline record");
    // A named human's declaration is recorded as a review claim, not authenticated approval.
    if (d.review_state !== "HUMAN_REVIEW_DECLARED" || typeof d.official_source_url !== "string" ||
        !d.official_source_url.startsWith("https://") || typeof d.review_reference !== "string" || !d.review_reference)
      throw new Error("deadline needs source and review reference; do not infer dates from news text");
    if (byEvent.has(d.event_sha256)) throw new Error("duplicate deadline for event");
    byEvent.set(d.event_sha256, d);
  }
  const seen = new Set();
  const items = queue.items.map((item) => {
    if (!DIGEST.test(item.event_sha256 ?? "")) throw new Error("malformed event digest");
    if (seen.has(item.event_sha256)) throw new Error("duplicate event digest");
    seen.add(item.event_sha256);
    const deadline = byEvent.get(item.event_sha256);
    const window = deadlineState(deadline?.effective_date, asOf);
    return {
      event_sha256: item.event_sha256,
      jurisdiction: item.jurisdiction ?? null,
      instrument: item.instrument ?? null,
      provision: item.provision ?? null,
      source_index: item.source_index ?? null,
      source_status: item.clock_source_status ?? "UNVERIFIED",
      source_url: deadline?.official_source_url ?? item.official_source_url ?? null,
      effective_date: deadline?.effective_date ?? null,
      deadline_review_reference: deadline?.review_reference ?? null,
      ...window,
      applicability: "UNASSESSED",
      gspc_mapping: "PENDING_HUMAN_REVIEW",
      review_authority: "UNVERIFIED",
      working_group_dispatch: "NOT_SENT",
      decision: "NO_DECISION",
      disposition: "REVIEW_CANDIDATE_NOT_MATERIALITY_FINDING",
    };
  });
  return {
    schema: "csoai.regulatory-impact-candidates/0.1",
    generated_as_of: new Date(asOf).toISOString().slice(0, 10),
    parent_report_sha256: queue.report_sha256,
    parent_crosswalk_sha256: queue.crosswalk_sha256,
    items,
    controls: {
      external_notifications: false,
      legal_mappings_approved: false,
      gspc_scores_changed: false,
      tokens_issued: false,
      human_acceptance_verified: false,
    },
    limitations: [
      "A source hash change is not a material legal change.",
      "A reviewed-deadline declaration is not cryptographic verification of a reviewer.",
      "An effective date is not a determination that the rule applies to any customer.",
      "No external WG, regulator or human is contacted by this module.",
    ],
  };
}
