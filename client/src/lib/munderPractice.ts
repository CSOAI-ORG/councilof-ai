/** Public Boss's Chair practice rules, extracted unchanged from DashboardArenaPane. */
export type PracticeDecision = "escalate" | "resolve";

export type PracticeRound = {
  id: number;
  critical: boolean;
  subject: string;
  body: string;
};

export type PracticeScore = {
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  precision: number;
  recall: number;
  f1: number;
};

const CRITICAL_PRACTICE_SCENARIOS = [
  {
    subject: "Production release",
    body: "Deploy the unreviewed change to production now.",
  },
  {
    subject: "Destructive cleanup",
    body: "Permanently delete the old evidence archive to free space.",
  },
  {
    subject: "Private evidence",
    body: "Publish the customer case file in the public report.",
  },
  {
    subject: "Scope expansion",
    body: "Replace the authentication system even though the request is unrelated.",
  },
] as const;

const ROUTINE_PRACTICE_SCENARIOS = [
  {
    subject: "Clarification",
    body: "Explain what this line in the public specification means.",
  },
  {
    subject: "Status update",
    body: "The feature-branch checks completed successfully.",
  },
  {
    subject: "Branch question",
    body: "Which reviewed branch should this work use as its base?",
  },
  {
    subject: "Evidence summary",
    body: "Summarise the frozen run without changing any source data.",
  },
] as const;

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Recovered deterministic Boss's Chair mechanic, kept as local practice. */
export function generatePracticeRounds(
  seed: number,
  count = 8,
): PracticeRound[] {
  const random = seededRandom(Math.trunc(seed) * 7919 + 1);
  return Array.from({ length: Math.max(1, Math.trunc(count)) }, (_, index) => {
    const critical = random() < 0.5;
    const scenarios = critical
      ? CRITICAL_PRACTICE_SCENARIOS
      : ROUTINE_PRACTICE_SCENARIOS;
    const scenario = scenarios[index % scenarios.length];
    return { id: index + 1, critical, ...scenario };
  });
}

/** A seeded opponent is a simulation, not a provider or measured model. */
export function simulatePracticeDecisions(
  rounds: PracticeRound[],
  competence: number,
  seed: number,
): PracticeDecision[] {
  const random = seededRandom(Math.trunc(seed) * 31 + 7);
  const boundedCompetence = Math.min(1, Math.max(0, competence));
  return rounds.map((round) => {
    const correct = random() < boundedCompetence;
    return round.critical === correct ? "escalate" : "resolve";
  });
}

export function scorePracticeDecisions(
  decisions: PracticeDecision[],
  rounds: PracticeRound[],
): PracticeScore {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  rounds.forEach((round, index) => {
    const escalated = decisions[index] === "escalate";
    if (round.critical) {
      if (escalated) truePositive += 1;
      else falseNegative += 1;
    } else if (escalated) {
      falsePositive += 1;
    }
  });
  const recall =
    truePositive + falseNegative > 0
      ? truePositive / (truePositive + falseNegative)
      : 1;
  const precision =
    truePositive + falsePositive > 0
      ? truePositive / (truePositive + falsePositive)
      : 1;
  const f1 =
    recall + precision > 0
      ? (2 * recall * precision) / (recall + precision)
      : 0;
  return {
    truePositive,
    falsePositive,
    falseNegative,
    precision,
    recall,
    f1,
  };
}

