import type { GspcLearningPath, LearningStageId } from "@/data/gspc-learning-paths";

export type LearningReviewDecision = "READY_FOR_REVIEW" | "RETURN_FOR_REVISION" | "DISCARD";
export interface LearningChallengeState {
  axisId: string;
  stageId: LearningStageId;
  paths: readonly GspcLearningPath[];
  rosterState: "READING" | "LIVE" | "FREEZE";
  completedByAxis: Record<string, string[]>;
  reviewByAxis: Record<string, LearningReviewDecision>;
}

// One handoff in this page session. URL parameters never supply practice progress.
let handoff: LearningChallengeState | null = null;

function validState(state: LearningChallengeState): boolean {
  const path = state.paths.find((item) => item.axis.id === state.axisId);
  const completed = state.completedByAxis[state.axisId] ?? [];
  return !!path && Array.isArray(completed) &&
    completed.every((id, index) => id === path.stages[index]?.id) &&
    path.stages[completed.length]?.id === state.stageId;
}

function copyState(state: LearningChallengeState): LearningChallengeState {
  return {
    ...state,
    paths: [...state.paths],
    completedByAxis: Object.fromEntries(
      Object.entries(state.completedByAxis).map(([axis, stages]) => [axis, [...stages]]),
    ),
    reviewByAxis: { ...state.reviewByAxis },
  };
}

function exactParams(search: string, keys: readonly string[]): URLSearchParams | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if ([...params.keys()].length !== keys.length ||
      keys.some((key) => params.getAll(key).length !== 1)) return null;
  return params;
}

function matchesHandoff(params: URLSearchParams | null): boolean {
  return !!params && !!handoff && validState(handoff) &&
    params.get("axis") === handoff.axisId && params.get("stage") === handoff.stageId;
}

export function learningChallengePath(state: LearningChallengeState): string | null {
  if (!validState(state)) return null;
  return "/gspc-quests.html?" + new URLSearchParams({
    axis: state.axisId,
    stage: state.stageId,
  }).toString();
}

export function rememberLearningChallenge(state: LearningChallengeState): boolean {
  if (!validState(state)) return false;
  handoff = copyState(state);
  return true;
}

export function learningChallengeReturn(path: string): {
  href: string; axisId: string; stageId: LearningStageId;
} | null {
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  try {
    const url = new URL(path, "https://councilof.ai");
    if (url.origin !== "https://councilof.ai" ||
        url.pathname !== "/gspc-quests.html" || url.hash) return null;
    const params = exactParams(url.search, ["axis", "stage"]);
    if (!matchesHandoff(params) || !handoff) return null;
    return {
      href: "/dashboard?" + new URLSearchParams({
        tab: "learn", axis: handoff.axisId, stage: handoff.stageId,
      }).toString(),
      axisId: handoff.axisId,
      stageId: handoff.stageId,
    };
  } catch {
    return null;
  }
}

export function readLearningReturn(search: string): LearningChallengeState | null {
  const params = exactParams(search, ["tab", "axis", "stage"]);
  return params?.get("tab") === "learn" && matchesHandoff(params) && handoff
    ? copyState(handoff) : null;
}

export function clearLearningChallenge(): void {
  handoff = null;
}
