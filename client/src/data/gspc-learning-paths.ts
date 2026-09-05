/**
 * Pure, local learning paths derived from the committed GSPC axis canon.
 *
 * This module does not fetch the living board, persist progress, submit evidence,
 * run a model, train a model, or write a GSPC cell. It only gives the dashboard a
 * deterministic five-stage learning sequence for every axis already named by the
 * committed board snapshot. Live measurement state remains the API's concern.
 */

import BOARD_SNAPSHOT from "../../../public/signed/gspc-board.signed.json";

export const GSPC_LEARNING_PATH_SCHEMA =
  "csoai.gspc-learning-path/0.1" as const;
export const GSPC_LEARNING_PROGRESS_SCHEMA =
  "csoai.gspc-learning-progress/0.1" as const;

export const LEARNING_STAGE_IDS = [
  "learn",
  "play",
  "explain",
  "propose-fix",
  "human-review",
] as const;

export type LearningStageId = (typeof LEARNING_STAGE_IDS)[number];
export type LearningStageState = "COMPLETE" | "AVAILABLE" | "LOCKED";

export interface LearningAxisDefinition {
  /** Identity copied at build time from the canonical board row. */
  id: string;
  family: "gspc" | "financial";
  kind: "model-comparison" | "deterministic-facts" | "declared-slot";
  bench: string;
  task: string;
}

export interface LearningStage {
  id: LearningStageId;
  order: number;
  label: string;
  mode: "PRACTICE" | "HUMAN_REVIEW";
  objective: string;
  completionArtifact:
    | "LEARNING_NOTE"
    | "PRACTICE_ATTEMPT"
    | "RATIONALE"
    | "FIX_PROPOSAL"
    | "REVIEW_DECISION";
  /** Completing a learning stage never changes the evidence state. */
  evidenceEffect: "NONE";
}

export interface GspcLearningPath {
  schema: typeof GSPC_LEARNING_PATH_SCHEMA;
  axis: Readonly<LearningAxisDefinition>;
  stages: readonly Readonly<LearningStage>[];
  evidenceBoundary: typeof EVIDENCE_BOUNDARY;
  runtime: typeof PURE_RUNTIME;
}

const PURE_RUNTIME = Object.freeze({
  networkRequests: false,
  persistentWrites: false,
  providerCalls: false,
  modelTraining: false,
  boardWrites: false,
  automaticPromotion: false,
} as const);

const EVIDENCE_BOUNDARY = Object.freeze({
  practiceArtifactState: "PRACTICE_ONLY",
  measurementState: "UNMEASURED",
  practiceIsEvidence: false,
  humanReviewCreatesEvidence: false,
  humanReviewCreatesMeasurement: false,
  separateExplicitIntakeRequired: true,
  possibleStateAfterSeparateIntake: "CANDIDATE_FINDING",
  automaticAdmission: false,
  automaticSigning: false,
} as const);

type CanonicalAxisRow = {
  axis: string;
  family: LearningAxisDefinition["family"];
  kind: LearningAxisDefinition["kind"];
  bench: string;
  task: string;
};

export const LEARNING_AXIS_SOURCE = Object.freeze({
  kind: "COMMITTED_BOARD_SNAPSHOT",
  live: false,
  identityFieldsOnly: true,
  signatureVerifiedHere: false,
  liveAuthority: "GET /api/gspc",
} as const);

function readCanonicalAxisRows(value: unknown): readonly CanonicalAxisRow[] {
  if (!value || typeof value !== "object")
    throw new Error("GSPC board snapshot is unavailable");
  const rows = (value as { axes?: unknown }).axes;
  if (!Array.isArray(rows))
    throw new Error("GSPC board snapshot has no axis canon");

  const canonical = rows.map((row): CanonicalAxisRow => {
    if (!row || typeof row !== "object")
      throw new Error("GSPC axis canon contains a non-object row");
    const candidate = row as Record<string, unknown>;
    if (
      typeof candidate.axis !== "string" ||
      typeof candidate.bench !== "string" ||
      typeof candidate.task !== "string" ||
      (candidate.family !== "gspc" && candidate.family !== "financial") ||
      (candidate.kind !== "model-comparison" &&
        candidate.kind !== "deterministic-facts" &&
        candidate.kind !== "declared-slot")
    )
      throw new Error("GSPC axis canon contains an unsupported row");
    return {
      axis: candidate.axis,
      family: candidate.family,
      kind: candidate.kind,
      bench: candidate.bench,
      task: candidate.task,
    };
  });
  if (new Set(canonical.map((row) => row.axis)).size !== canonical.length)
    throw new Error("GSPC axis canon contains duplicate ids");
  return Object.freeze(canonical.map((row) => Object.freeze(row)));
}

const CANONICAL_AXIS_ROWS = readCanonicalAxisRows(BOARD_SNAPSHOT);

export const CANONICAL_AXIS_COUNT = CANONICAL_AXIS_ROWS.length;

function stageDefinitions(
  axis: LearningAxisDefinition,
): readonly LearningStage[] {
  return Object.freeze([
    Object.freeze({
      id: "learn",
      order: 0,
      label: "Learn",
      mode: "PRACTICE",
      objective: `Read the supplied ${axis.bench} material for: ${axis.task}.`,
      completionArtifact: "LEARNING_NOTE",
      evidenceEffect: "NONE",
    }),
    Object.freeze({
      id: "play",
      order: 1,
      label: "Play",
      mode: "PRACTICE",
      objective: `Attempt a bounded ${axis.id} practice scenario without changing a live system.`,
      completionArtifact: "PRACTICE_ATTEMPT",
      evidenceEffect: "NONE",
    }),
    Object.freeze({
      id: "explain",
      order: 2,
      label: "Explain",
      mode: "PRACTICE",
      objective:
        "Explain the choice, assumptions, uncertainty, and supplied source material in plain language.",
      completionArtifact: "RATIONALE",
      evidenceEffect: "NONE",
    }),
    Object.freeze({
      id: "propose-fix",
      order: 3,
      label: "Propose fix",
      mode: "PRACTICE",
      objective:
        "Propose a bounded fix with trade-offs and a verification plan; do not apply it.",
      completionArtifact: "FIX_PROPOSAL",
      evidenceEffect: "NONE",
    }),
    Object.freeze({
      id: "human-review",
      order: 4,
      label: "Human review",
      mode: "HUMAN_REVIEW",
      objective:
        "Ask a human to accept, return, or reject the practice record. Review does not admit GSPC evidence.",
      completionArtifact: "REVIEW_DECISION",
      evidenceEffect: "NONE",
    }),
  ]);
}

function makePath(row: CanonicalAxisRow): GspcLearningPath {
  const axis = Object.freeze({
    id: row.axis,
    family: row.family,
    kind: row.kind,
    bench: row.bench,
    task: row.task,
  });
  return Object.freeze({
    schema: GSPC_LEARNING_PATH_SCHEMA,
    axis,
    stages: stageDefinitions(axis),
    evidenceBoundary: EVIDENCE_BOUNDARY,
    runtime: PURE_RUNTIME,
  });
}

/** One path per canonical row, in canonical board order. */
export const GSPC_LEARNING_PATHS: readonly GspcLearningPath[] = Object.freeze(
  CANONICAL_AXIS_ROWS.map(makePath),
);

const PATH_BY_AXIS = new Map(
  GSPC_LEARNING_PATHS.map((path) => [path.axis.id, path] as const),
);

export function getGspcLearningPath(axisId: string): GspcLearningPath | null {
  return PATH_BY_AXIS.get(axisId) ?? null;
}

export interface LearningProgress {
  schema: typeof GSPC_LEARNING_PROGRESS_SCHEMA;
  axisId: string;
  valid: boolean;
  completedStageIds: readonly LearningStageId[];
  rejectedStageIds: readonly string[];
  activeStageId: LearningStageId | null;
  completionRatio: number;
  stages: readonly {
    id: LearningStageId;
    state: LearningStageState;
  }[];
  evidence: {
    artifactState: "PRACTICE_ONLY";
    measurementState: "UNMEASURED";
    candidateFindingCreated: false;
    signedRecordCreated: false;
  };
  runtime: typeof PURE_RUNTIME;
}

/**
 * Derive display progress from caller-supplied UI state. Only a canonical prefix
 * is accepted: later or unknown stages are reported as rejected and remain
 * locked. The returned progress is not proof that a person performed a stage.
 */
export function deriveLearningProgress(
  axisId: string,
  requestedCompletedStageIds: readonly string[],
): LearningProgress | null {
  if (!PATH_BY_AXIS.has(axisId)) return null;

  const requested = new Set(requestedCompletedStageIds);
  const completed: LearningStageId[] = [];
  for (const stageId of LEARNING_STAGE_IDS) {
    if (!requested.has(stageId)) break;
    completed.push(stageId);
  }

  const completedSet = new Set<string>(completed);
  const duplicateIds = requestedCompletedStageIds.filter(
    (id, index) => requestedCompletedStageIds.indexOf(id) !== index,
  );
  const rejected = [
    ...new Set(
      requestedCompletedStageIds
        .filter((id) => !completedSet.has(id))
        .concat(duplicateIds),
    ),
  ];
  const activeStageId = LEARNING_STAGE_IDS[completed.length] ?? null;
  const stages = LEARNING_STAGE_IDS.map((id, index) => ({
    id,
    state: (index < completed.length
      ? "COMPLETE"
      : index === completed.length
        ? "AVAILABLE"
        : "LOCKED") as LearningStageState,
  }));

  return Object.freeze({
    schema: GSPC_LEARNING_PROGRESS_SCHEMA,
    axisId,
    valid: rejected.length === 0,
    completedStageIds: Object.freeze(completed),
    rejectedStageIds: Object.freeze(rejected),
    activeStageId,
    completionRatio: completed.length / LEARNING_STAGE_IDS.length,
    stages: Object.freeze(stages.map((stage) => Object.freeze(stage))),
    evidence: Object.freeze({
      artifactState: "PRACTICE_ONLY",
      measurementState: "UNMEASURED",
      candidateFindingCreated: false,
      signedRecordCreated: false,
    }),
    runtime: PURE_RUNTIME,
  });
}
