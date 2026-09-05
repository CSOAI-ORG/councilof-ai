import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BossChairPractice from "./BossChairPractice";
import {
  BOSS_CHAIR_SCENARIOS,
  bossChairReducer,
  bossChairScore,
  createBossChairState,
  currentBossChairAnswer,
  judgeBossChairDecision,
} from "./bossChairModel";
import { normalizeLobbyTabId } from "./tabs";

describe("Boss's Chair browser practice", () => {
  it("does not advance or score a missing answer", () => {
    const initial = createBossChairState();
    expect(bossChairReducer(initial, { type: "next" })).toBe(initial);
    expect(judgeBossChairDecision(BOSS_CHAIR_SCENARIOS[0], null)).toEqual({
      state: "unanswered",
      correct: null,
      explanation: "Choose resolve or escalate before moving on.",
    });
    expect(bossChairScore(initial)).toBe(0);
  });

  it("keeps a wrong answer and exposes the bounded explanation", () => {
    const initial = createBossChairState();
    const answered = bossChairReducer(initial, {
      type: "answer",
      decision: "resolve",
    });
    expect(currentBossChairAnswer(answered)).toMatchObject({
      scenarioId: "gpu-spend",
      decision: "resolve",
      correct: false,
    });

    const html = renderToStaticMarkup(
      <BossChairPractice initialState={answered} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Not quite.");
    expect(html).toContain("external financial commitment");
  });

  it("retry clears answers, score and position", () => {
    let state = createBossChairState();
    state = bossChairReducer(state, {
      type: "answer",
      decision: "escalate",
    });
    state = bossChairReducer(state, { type: "next" });
    expect(state.roundIndex).toBe(1);
    expect(bossChairScore(state)).toBe(1);
    expect(bossChairReducer(state, { type: "retry" })).toEqual(
      createBossChairState(),
    );
  });

  it("renders accessible choices and states its evidence boundary", () => {
    const html = renderToStaticMarkup(<BossChairPractice />);
    expect(html).toContain("The Boss&#x27;s Chair");
    expect(html).toContain("Choose how to handle this request");
    expect(html).toContain("Escalate for human approval");
    expect(html).toContain("Resolve within bounds");
    expect(html).toContain("not a live AI opponent");
    expect(html).toContain("not submitted or persisted by this practice");
    expect(html).toContain("not evidence, certification or training data");
  });

  it("keeps games as a compatibility alias for the canonical play pane", () => {
    expect(normalizeLobbyTabId("games")).toBe("play");
    expect(normalizeLobbyTabId("play")).toBe("play");
  });
});
