// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { triageRegulatoryQueue } from "./regulatory-impact.mjs";
const a = "a".repeat(64), b = "b".repeat(64), c = "c".repeat(64);
const queue = { schema: "csoai.daily-mapping-review-queue/0.1", report_sha256: a,
  crosswalk_sha256: b, items: [{ event_sha256: c, instrument: "EU AI Act", jurisdiction: "EU",
    clock_source_status: "PENDING", source_index: 1 }] };
test("no invented deadline, no automatic routing or approval", () => {
  const result = triageRegulatoryQueue(queue, { asOf: "2026-11-22" });
  const item = result.items[0];
  assert.equal(item.state, "DEADLINE_NOT_VERIFIED");
  assert.equal(item.gspc_mapping, "PENDING_HUMAN_REVIEW");
  assert.equal(item.working_group_dispatch, "NOT_SENT");
  assert.equal(item.decision, "NO_DECISION");
  assert.equal(result.controls.tokens_issued, false);
});
test("dates trigger review windows, not claims of applicability", () => {
  const result = triageRegulatoryQueue(queue, { asOf: "2026-11-22", reviewedDeadlines: [{
    event_sha256: c, effective_date: "2026-12-02",
    review_state: "HUMAN_REVIEW_DECLARED",
    official_source_url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act",
    review_reference: "local-review-not-authority",
  }] });
  assert.equal(result.items[0].state, "WITHIN_30_DAYS_REVIEW");
  assert.equal(result.items[0].days_remaining, 10);
  assert.equal(result.items[0].applicability, "UNASSESSED");
  assert.equal(result.items[0].review_authority, "UNVERIFIED");
});
test("malformed or duplicate records fail closed", () => {
  assert.throws(() => triageRegulatoryQueue({...queue, items:[...queue.items, ...queue.items]}, {asOf:"2026-11-22"}), /duplicate/);
  assert.throws(() => triageRegulatoryQueue({...queue, report_sha256:"bad"}, {asOf:"2026-11-22"}), /hashes/);
  assert.throws(() => triageRegulatoryQueue(queue,{asOf:"2026-02-30"}), /invalid asOf/);
});
