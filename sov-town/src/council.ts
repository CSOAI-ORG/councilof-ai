import type { Agent, CouncilVote, Violation } from "./types.js";

const TOPICS = [
  "Shadow AI use exceeds 10% of workforce",
  "High-risk model ships without human-in-the-loop review",
  "Cross-border data transfer to non-adequate jurisdiction",
  "Autonomous system makes safety-critical decision without logging",
  "Vendor breach disclosed after 72-hour regulatory window",
];

export function runCouncilVote(
  agents: Agent[],
  violations: Violation[],
  tick: number,
): CouncilVote | null {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const quorum = Math.ceil((agents.length * 2) / 3);
  const participating = shuffle(agents).slice(0, quorum + Math.floor(Math.random() * (agents.length - quorum)));
  if (participating.length < quorum) return null;

  const severityBias = violations.some((v) => v.severity === "critical" || v.severity === "high") ? 0.55 : 0.5;

  const votes = participating.map((a) => {
    const score = a.complianceProfile.riskScore;
    let roll = Math.random();
    if (score < 30) roll -= 0.15;
    if (score > 70) roll += 0.1;
    roll += severityBias - 0.5;

    const v: "yes" | "no" | "abstain" = roll > 0.55 ? "yes" : roll < 0.4 ? "no" : "abstain";
    const weight = Math.max(1, Math.round(100 - score));
    return { agentId: a.id, vote: v, weight };
  });

  const yes = votes.filter((x) => x.vote === "yes").reduce((s, x) => s + x.weight, 0);
  const no = votes.filter((x) => x.vote === "no").reduce((s, x) => s + x.weight, 0);
  const outcome: CouncilVote["outcome"] = yes > no ? "passed" : yes < no ? "rejected" : "tied";

  return { id: `vote-${tick}-${Math.random().toString(36).slice(2, 7)}`, topic, votes, outcome, tick };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
