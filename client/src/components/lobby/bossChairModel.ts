export type BossChairDecision = "escalate" | "resolve";

export type BossChairScenario = {
  id: string;
  request: string;
  detail: string;
  boundary: "spend" | "destructive" | "production" | "scope" | "routine";
  correctDecision: BossChairDecision;
  explanation: string;
};

/**
 * Authored browser-practice cases. They use the donor harness's simple
 * resolve-versus-escalate boundary, but do not copy its stale axis model,
 * signing flow, or seeded mock-agent claims.
 */
export const BOSS_CHAIR_SCENARIOS: readonly BossChairScenario[] = [
  {
    id: "gpu-spend",
    request: "A worker asks to rent another GPU for a longer benchmark run.",
    detail: "The run may improve coverage, but it creates a new paid resource.",
    boundary: "spend",
    correctDecision: "escalate",
    explanation:
      "Spending creates an external financial commitment. Keep the preparation autonomous, but require a person to approve the charge.",
  },
  {
    id: "status-note",
    request: "A worker reports that its feature-branch tests are green.",
    detail: "It is only a status update; no release or external action is requested.",
    boundary: "routine",
    correctDecision: "resolve",
    explanation:
      "A bounded status update needs no approval. Record it and continue within the existing task.",
  },
  {
    id: "delete-builds",
    request: "A worker wants to recursively delete old build directories.",
    detail: "The target list has not been reviewed and the deletion is hard to reverse.",
    boundary: "destructive",
    correctDecision: "escalate",
    explanation:
      "Broad or hard-to-recover deletion needs human review of the exact targets. A reversible cleanup proposal can be prepared first.",
  },
  {
    id: "clarify-spec",
    request: "A worker asks what one sentence in the approved specification means.",
    detail: "The answer can be derived from the checked-in scope and changes no external state.",
    boundary: "routine",
    correctDecision: "resolve",
    explanation:
      "Reading the approved scope and answering a clarification is routine, reversible work that can continue autonomously.",
  },
  {
    id: "production-release",
    request: "A worker asks to deploy the current branch directly to production.",
    detail: "The branch has not passed the production release gate or owner review.",
    boundary: "production",
    correctDecision: "escalate",
    explanation:
      "A production release changes a live external system. Prepare and test the candidate, then stop for the authorised release decision.",
  },
  {
    id: "local-typo",
    request: "A worker offers to fix a typo in a local draft and run its focused test.",
    detail: "The edit is in scope, reversible, and does not publish or message anyone.",
    boundary: "routine",
    correctDecision: "resolve",
    explanation:
      "A small, reversible in-scope edit and local test are routine. The worker can complete them and report the result.",
  },
  {
    id: "auth-rewrite",
    request: "A worker proposes replacing the entire authentication system.",
    detail: "The request only asked for a dashboard wording fix.",
    boundary: "scope",
    correctDecision: "escalate",
    explanation:
      "Rewriting authentication materially expands the agreed task and risk. Diagnose and propose options, but require a person to choose the new scope.",
  },
  {
    id: "read-only-audit",
    request: "A worker wants to inspect the route registry and report duplicate destinations.",
    detail: "The audit is read-only and remains inside the requested product surface.",
    boundary: "routine",
    correctDecision: "resolve",
    explanation:
      "A read-only, in-scope audit is routine. It can proceed without changing routes, publishing, or contacting anyone.",
  },
] as const;

export type BossChairAnswer = {
  scenarioId: string;
  decision: BossChairDecision;
  correct: boolean;
};

export type BossChairState = {
  roundIndex: number;
  answers: readonly BossChairAnswer[];
  phase: "playing" | "complete";
};

export type BossChairAction =
  | { type: "answer"; decision: BossChairDecision }
  | { type: "next" }
  | { type: "retry" };

export type BossChairJudgement =
  | { state: "unanswered"; correct: null; explanation: string }
  | { state: "answered"; correct: boolean; explanation: string };

export function createBossChairState(): BossChairState {
  return { roundIndex: 0, answers: [], phase: "playing" };
}

export function currentBossChairScenario(
  state: BossChairState,
): BossChairScenario | null {
  return state.phase === "playing"
    ? BOSS_CHAIR_SCENARIOS[state.roundIndex] ?? null
    : null;
}

export function currentBossChairAnswer(
  state: BossChairState,
): BossChairAnswer | null {
  const scenario = currentBossChairScenario(state);
  return scenario
    ? state.answers.find((answer) => answer.scenarioId === scenario.id) ?? null
    : null;
}

export function judgeBossChairDecision(
  scenario: BossChairScenario,
  decision: BossChairDecision | null,
): BossChairJudgement {
  if (!decision) {
    return {
      state: "unanswered",
      correct: null,
      explanation: "Choose resolve or escalate before moving on.",
    };
  }
  return {
    state: "answered",
    correct: decision === scenario.correctDecision,
    explanation: scenario.explanation,
  };
}

export function bossChairScore(state: BossChairState): number {
  return state.answers.filter((answer) => answer.correct).length;
}

export function bossChairReducer(
  state: BossChairState,
  action: BossChairAction,
): BossChairState {
  if (action.type === "retry") return createBossChairState();
  if (state.phase === "complete") return state;

  const scenario = currentBossChairScenario(state);
  if (!scenario) return state;
  const existing = currentBossChairAnswer(state);

  if (action.type === "answer") {
    if (existing) return state;
    return {
      ...state,
      answers: [
        ...state.answers,
        {
          scenarioId: scenario.id,
          decision: action.decision,
          correct: action.decision === scenario.correctDecision,
        },
      ],
    };
  }

  if (!existing) return state;
  if (state.roundIndex >= BOSS_CHAIR_SCENARIOS.length - 1) {
    return { ...state, phase: "complete" };
  }
  return { ...state, roundIndex: state.roundIndex + 1 };
}
