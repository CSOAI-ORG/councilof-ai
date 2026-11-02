// Shared mapping from a published decision-ledger record to a JSpaceTimeline
// event. One implementation, two surfaces: the legacy CouncilSpace page and
// the dashboard arena pane both render the ledger through this.
import type { TimelineEvent } from "../JSpaceTimeline";
import type { DecisionRecord } from "@/hooks/useLedger";

const VERDICT_WEIGHT: Record<string, number> = {
  REFUTED: 1.0,
  CONFIRMED: 1.0,
  SETTLED: 1.0,
  OPEN: 0.6,
};

export function decisionToTimeline(r: DecisionRecord): TimelineEvent {
  return {
    id: r.id,
    ts: r.decided_on,
    tag: r.tag,
    verdict: r.verdict,
    claim: r.claim,
    evidence: r.evidence,
    sigil: r.sigil_link,
    weight: VERDICT_WEIGHT[r.verdict] ?? 0.7,
    space: "J",
  };
}

export function decisionsToTimelineEvents(
  records: DecisionRecord[],
): TimelineEvent[] {
  return records.map(decisionToTimeline);
}
