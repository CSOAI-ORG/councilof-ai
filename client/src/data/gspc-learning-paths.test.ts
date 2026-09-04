import { describe, expect, it } from "vitest";
import BOARD_SNAPSHOT from "../../../public/signed/gspc-board.signed.json";
import {
  CANONICAL_AXIS_COUNT,
  GSPC_LEARNING_PATHS,
  LEARNING_STAGE_IDS,
  deriveLearningProgress,
  getGspcLearningPath,
} from "./gspc-learning-paths";

const CANON = BOARD_SNAPSHOT.axes;

describe("GSPC canonical learning paths", () => {
  it("derives one path per existing canonical axis without a parallel list", () => {
    expect(CANONICAL_AXIS_COUNT).toBe(CANON.length);
    expect(GSPC_LEARNING_PATHS).toHaveLength(CANON.length);
    expect(GSPC_LEARNING_PATHS.map((path) => path.axis.id)).toEqual(
      CANON.map((row) => row.axis),
    );
    expect(new Set(GSPC_LEARNING_PATHS.map((path) => path.axis.id)).size).toBe(
      CANON.length,
    );

    GSPC_LEARNING_PATHS.forEach((path, index) => {
      expect(path.axis).toEqual({
        id: CANON[index].axis,
        family: CANON[index].family,
        kind: CANON[index].kind,
        bench: CANON[index].bench,
        task: CANON[index].task,
      });
      expect(path.axis).not.toHaveProperty("accuracy");
      expect(path.axis).not.toHaveProperty("status");
    });
  });

  it("gives every axis the required ordered learning progression", () => {
    for (const path of GSPC_LEARNING_PATHS) {
      expect(path.stages.map((stage) => stage.id)).toEqual(LEARNING_STAGE_IDS);
      expect(path.stages.map((stage) => stage.order)).toEqual(
        LEARNING_STAGE_IDS.map((_, index) => index),
      );
      expect(path.stages.slice(0, -1).every((s) => s.mode === "PRACTICE")).toBe(
        true,
      );
      expect(path.stages.at(-1)?.mode).toBe("HUMAN_REVIEW");
    }
  });

  it("keeps every learning artifact outside the evidence pipeline", () => {
    for (const path of GSPC_LEARNING_PATHS) {
      expect(
        path.stages.every((stage) => stage.evidenceEffect === "NONE"),
      ).toBe(true);
      expect(path.evidenceBoundary).toMatchObject({
        practiceArtifactState: "PRACTICE_ONLY",
        measurementState: "UNMEASURED",
        practiceIsEvidence: false,
        humanReviewCreatesEvidence: false,
        humanReviewCreatesMeasurement: false,
        separateExplicitIntakeRequired: true,
        possibleStateAfterSeparateIntake: "CANDIDATE_FINDING",
        automaticAdmission: false,
        automaticSigning: false,
      });
      expect(path.runtime).toEqual({
        networkRequests: false,
        persistentWrites: false,
        providerCalls: false,
        modelTraining: false,
        boardWrites: false,
        automaticPromotion: false,
      });
    }
  });

  it("unlocks stages in order and derives progress without side effects", () => {
    const axisId = GSPC_LEARNING_PATHS[0].axis.id;
    const start = deriveLearningProgress(axisId, []);
    const progressed = deriveLearningProgress(axisId, [
      "learn",
      "play",
      "explain",
    ]);
    const complete = deriveLearningProgress(axisId, LEARNING_STAGE_IDS);

    expect(start).toMatchObject({
      valid: true,
      activeStageId: "learn",
      completionRatio: 0,
      stages: [
        { id: "learn", state: "AVAILABLE" },
        { id: "play", state: "LOCKED" },
        { id: "explain", state: "LOCKED" },
        { id: "propose-fix", state: "LOCKED" },
        { id: "human-review", state: "LOCKED" },
      ],
    });
    expect(progressed).toMatchObject({
      valid: true,
      completedStageIds: ["learn", "play", "explain"],
      activeStageId: "propose-fix",
      stages: [
        { id: "learn", state: "COMPLETE" },
        { id: "play", state: "COMPLETE" },
        { id: "explain", state: "COMPLETE" },
        { id: "propose-fix", state: "AVAILABLE" },
        { id: "human-review", state: "LOCKED" },
      ],
    });
    expect(complete).toMatchObject({
      valid: true,
      activeStageId: null,
      completionRatio: 1,
      evidence: {
        artifactState: "PRACTICE_ONLY",
        measurementState: "UNMEASURED",
        candidateFindingCreated: false,
        signedRecordCreated: false,
      },
    });
  });

  it("rejects skipped, unknown, and duplicate UI completion claims", () => {
    const axisId = GSPC_LEARNING_PATHS[0].axis.id;
    const progress = deriveLearningProgress(axisId, [
      "play",
      "unknown-stage",
      "play",
    ]);

    expect(progress).toMatchObject({
      valid: false,
      completedStageIds: [],
      rejectedStageIds: ["play", "unknown-stage"],
      activeStageId: "learn",
      completionRatio: 0,
    });

    expect(deriveLearningProgress(axisId, ["learn", "learn"])).toMatchObject({
      valid: false,
      completedStageIds: ["learn"],
      rejectedStageIds: ["learn"],
      activeStageId: "play",
    });
  });

  it("resolves only canonical axes and exposes immutable path data", () => {
    const first = GSPC_LEARNING_PATHS[0];
    expect(getGspcLearningPath(first.axis.id)).toBe(first);
    expect(getGspcLearningPath("not-a-canonical-axis")).toBeNull();
    expect(Object.isFrozen(GSPC_LEARNING_PATHS)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.axis)).toBe(true);
    expect(Object.isFrozen(first.stages)).toBe(true);
  });
});
