import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "vitest";
import BOARD_SNAPSHOT from "../../../public/signed/gspc-board.2026-09-29.signed.json";
import {
  buildLearningPaths,
  deriveLearningProgress,
  type LearningStageId,
} from "../data/gspc-learning-paths";
import { LOBBY_TABS, normalizeLobbyTabId } from "../components/lobby/tabs";
import {
  clearLearningChallenge,
  learningChallengePath,
  learningChallengeReturn,
  readLearningReturn,
  rememberLearningChallenge,
  type LearningChallengeState,
} from "./learningChallenge";

const paths = buildLearningPaths(BOARD_SNAPSHOT);
const axis = paths[0].axis.id;
const otherAxis = paths[1].axis.id;
const state = (
  axisId = axis,
  completed: string[] = ["learn"],
  stageId: string = "play",
): LearningChallengeState => ({
  axisId,
  // The cast permits intentionally malformed stage fixtures for rejection checks.
  stageId: stageId as LearningStageId,
  paths,
  rosterState: "FREEZE",
  completedByAxis: { [axisId]: [...completed] },
  reviewByAxis: {},
});
const view = (axisId = axis, stage = "play") =>
  "/gspc-quests.html?" + new URLSearchParams({ axis: axisId, stage });
const search = (axisId = axis, stage = "play") =>
  "?" + new URLSearchParams({ tab: "learn", axis: axisId, stage });

beforeEach(clearLearningChallenge);
afterEach(clearLearningChallenge);

test("launch carries every real canonical axis and its actual active stage", () => {
  assert.equal(paths.length, BOARD_SNAPSHOT.axes.length);
  for (const path of paths) {
    const snapshot = state(path.axis.id);
    const progress = deriveLearningProgress(path.axis.id, snapshot.completedByAxis[path.axis.id], paths);
    assert.ok(progress);
    assert.equal(progress.valid, true);
    assert.equal(progress.activeStageId, "play");
    assert.equal(learningChallengePath(snapshot), view(path.axis.id));
  }
});

test("unknown axes, non-prefix progress and fabricated stages cannot create a handoff", () => {
  for (const snapshot of [
    state("not-a-canonical-axis"),
    state(axis, [], "play"),
    state(axis, ["play"], "explain"),
    state(axis, ["learn", "learn"], "explain"),
    state(axis, ["learn"], "human-review"),
    state(axis, ["learn", "not-a-stage"], "explain"),
  ]) {
    assert.equal(learningChallengePath(snapshot), null);
    assert.equal(rememberLearningChallenge(snapshot), false);
    assert.equal(readLearningReturn(search()), null);
  }
});

test("a URL alone cannot supply completed stages or restore a lesson", () => {
  assert.equal(learningChallengeReturn(view()), null);
  assert.equal(readLearningReturn(search()), null);
  assert.equal(readLearningReturn(search(axis, "human-review")), null);
});

test("actual close destination restores captured axis and real progress at Play", () => {
  const snapshot = state();
  assert.equal(rememberLearningChallenge(snapshot), true);
  const destination = learningChallengeReturn(view());
  assert.ok(destination);
  assert.equal(destination.href, "/dashboard" + search());
  const returned = readLearningReturn(new URL(destination.href, "https://councilof.ai").search);
  assert.ok(returned);
  assert.equal(returned.axisId, axis);
  assert.equal(returned.stageId, "play");
  assert.deepEqual(returned.completedByAxis, snapshot.completedByAxis);
  assert.deepEqual(returned.reviewByAxis, {});
  assert.equal(returned.rosterState, "FREEZE");
  const progress = deriveLearningProgress(returned.axisId, returned.completedByAxis[axis], returned.paths);
  assert.ok(progress);
  assert.equal(progress.valid, true);
  assert.equal(progress.activeStageId, "play");
  assert.deepEqual([...progress.completedStageIds], ["learn"]);
  assert.equal(progress.evidence.signedRecordCreated, false);
  assert.equal(progress.evidence.candidateFindingCreated, false);
});

test("mismatched canonical axis or stage cannot use another lesson's handoff", () => {
  rememberLearningChallenge(state());
  assert.equal(learningChallengeReturn(view(otherAxis)), null);
  assert.equal(learningChallengeReturn(view(axis, "learn")), null);
  assert.equal(learningChallengeReturn(view(axis, "explain")), null);
  assert.equal(readLearningReturn(search(otherAxis)), null);
  assert.equal(readLearningReturn(search(axis, "explain")), null);
  assert.equal(readLearningReturn(search().replace("tab=learn", "tab=explore")), null);
});

test("foreign, recursive, malformed and injected return contexts fail closed", () => {
  rememberLearningChallenge(state());
  const query = new URL(view(), "https://councilof.ai").search;
  for (const path of [
    "https://example.com" + view(), "https://councilof.ai" + view(),
    "//example.com" + view(), "/\\example.com" + view(),
    "/dashboard" + query, "/os" + query, "/other.html" + query,
    "/gspc-quests.html?axis=" + axis,
    view() + "&axis=" + otherAxis, view() + "&stage=human-review",
    view() + "&returnTo=https%3A%2F%2Fexample.com",
    view() + "&redirect=%2Fdashboard%3Ftab%3Dverify",
    view() + "#return", "/gspc-quests.html?axis=%&stage=play",
  ]) assert.equal(learningChallengeReturn(path), null, path);
  for (const value of [
    search() + "&axis=" + otherAxis,
    search() + "&stage=human-review",
    search() + "&completed=learn%2Cplay%2Cexplain",
    search() + "&returnTo=%2Fdashboard",
    "?tab=learn&axis=" + axis,
  ]) assert.equal(readLearningReturn(value), null, value);
});

test("handoff progress is isolated from caller and returned-object mutations", () => {
  const snapshot = state();
  rememberLearningChallenge(snapshot);
  snapshot.completedByAxis[axis].push("play");
  snapshot.reviewByAxis[axis] = "READY_FOR_REVIEW";
  const returned = readLearningReturn(search());
  assert.ok(returned);
  assert.deepEqual(returned.completedByAxis[axis], ["learn"]);
  assert.deepEqual(returned.reviewByAxis, {});
  returned.completedByAxis[axis].push("play");
  returned.reviewByAxis[axis] = "DISCARD";
  const reread = readLearningReturn(search());
  assert.ok(reread);
  assert.deepEqual(reread.completedByAxis[axis], ["learn"]);
  assert.deepEqual(reread.reviewByAxis, {});
});

test("a new actual lesson replaces the previous handoff rather than mixing contexts", () => {
  rememberLearningChallenge(state());
  rememberLearningChallenge(state(otherAxis));
  assert.equal(learningChallengeReturn(view()), null);
  assert.equal(readLearningReturn(search()), null);
  const destination = learningChallengeReturn(view(otherAxis));
  const returned = readLearningReturn(search(otherAxis));
  assert.ok(destination);
  assert.ok(returned);
  assert.equal(destination.axisId, otherAxis);
  assert.equal(returned.axisId, otherAxis);
});

test("stage context follows actual practice state and clearing prevents replay from a URL", () => {
  const snapshot = state(axis, ["learn", "play"], "explain");
  rememberLearningChallenge(snapshot);
  const returned = readLearningReturn(search(axis, "explain"));
  assert.ok(returned);
  const progress = deriveLearningProgress(axis, returned.completedByAxis[axis], returned.paths);
  assert.ok(progress);
  assert.equal(progress.activeStageId, "explain");
  assert.deepEqual([...progress.completedStageIds], ["learn", "play"]);
  clearLearningChallenge();
  assert.equal(readLearningReturn(search(axis, "explain")), null);
  assert.equal(learningChallengeReturn(view(axis, "explain")), null);
});

test("the fixed return tab resolves to the actual registered Learning tab", () => {
  rememberLearningChallenge(state());
  const destination = learningChallengeReturn(view());
  assert.ok(destination);
  const params = new URL(destination.href, "https://councilof.ai").searchParams;
  const tab = params.get("tab");
  assert.equal(tab, "learn");
  assert.equal(normalizeLobbyTabId(tab), "learn");
  assert.equal(LOBBY_TABS.some((item) => item.id === tab), true);
  assert.equal(normalizeLobbyTabId("learning"), "learning");
  assert.equal(LOBBY_TABS.some((item) => String(item.id) === "learning"), false);
});

test("a real roster refresh with reordered current axes preserves the captured axis and stage", () => {
  rememberLearningChallenge(state());
  const returned = readLearningReturn(search());
  const refreshed = buildLearningPaths({ ...BOARD_SNAPSHOT, axes: [...BOARD_SNAPSHOT.axes].reverse() });
  assert.ok(returned);
  assert.notEqual(refreshed[0].axis.id, returned.axisId);
  const progress = deriveLearningProgress(
    returned.axisId, returned.completedByAxis[returned.axisId], refreshed,
  );
  assert.ok(progress);
  assert.equal(progress.axisId, returned.axisId);
  assert.equal(progress.valid, true);
  assert.equal(progress.activeStageId, "play");
  assert.deepEqual([...progress.completedStageIds], ["learn"]);
});
