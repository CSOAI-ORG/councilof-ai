import { afterEach, describe, expect, it, vi } from "vitest";
import { guidanceAnswer, guidanceTopic, type GuidanceTopic } from "./talkGuidance";
import { executePlan, routeIntent, talk } from "./talkRouter";
import { serveAguiRun } from "./aguiRun";

afterEach(() => vi.unstubAllGlobals());

describe("ordinary first-use questions", () => {
  const cases: [string, GuidanceTopic][] = [
    ["What is MEOK and how can I use it?", "meok"],
    ["How do I use MEOK?", "meok"],
    ["Explain H.I.M.", "meok"],
    ["Explain HIM", "meok"],
    ["What is Council of AI?", "council"],
    ["How do I use Council OS?", "council"],
    ["How do I use the Public Watchdog?", "watchdog"],
    ["Where can I find the research library in Watchdog?", "watchdog"],
    ["Where can I report an AI incident?", "incident-reporting"],
    ["How do I report an AI incident to the Public Watchdog?", "incident-reporting"],
    ["Where can I find Academy lessons?", "academy"],
    ["Where do I start?", "getting-started"],
    ["How do I get started here?", "getting-started"],
    ["I'm new here", "getting-started"],
    ["What can I do here?", "getting-started"],
  ];
  it.each(cases)("%s returns useful published-page guidance", async (question, topic) => {
    const fetchSpy = vi.fn(() => { throw new Error("guidance must not fetch"); });
    vi.stubGlobal("fetch", fetchSpy);
    expect(routeIntent(question)).toEqual({ kind: "help", intent: "guidance", topic });
    const result = await talk(question, "https://councilof.ai");
    expect(result.grounded).toBe(false);
    expect(result.label).toBe("GUIDANCE");
    expect(result.tool_calls).toEqual([]);
    expect(result.citations).toEqual([]);
    expect(result.answer).toContain("https://councilof.ai/");
    expect(result.answer).not.toContain("I could not match");
    expect(result.answered_by).toContain("no tool called");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("preserves entity, measurement and payment rules before guidance", () => {
    for (const [question, tool] of [
      ["What does Council of AI measure?", "board_totals"],
      ["What is measured about https://meok.ai?", "server_evidence"],
      ["How can I verify " + "ab".repeat(32) + " in MEOK?", "verify_card"],
      ["What does the leaderboard show?", "board_totals"],
      ["What evidence does Council of AI have for DORA?", "evidence_bundle_preview"],
      ["How do I commission a card for https://example.com/mcp?", "commission_card"],
      ["What is measured about qwen3:8b in MEOK?", "model_lookup"],
    ]) {
      const plan = routeIntent(question);
      expect(plan.kind === "tools" && plan.calls[0].tool).toBe(tool);
    }
    expect(routeIntent("How do I buy Council of AI services?")).toMatchObject({ intent: "buying" });
  });

  it("does not interpret unrelated topics or action commands as onboarding", () => {
    for (const question of ["Tell me about him", "him", "What is fameok?", "Where do I start cleaning my pond?", "Delete MEOK records", "Approve the MEOK proposal", "How is the weather?", ""]) {
      expect(guidanceTopic(question)).toBeNull();
      expect(routeIntent(question)).not.toMatchObject({ intent: "guidance" });
    }
  });

  it("links claims to the actual Watchdog, never its retired dashboard alias", () => {
    const answer = guidanceAnswer("watchdog");
    expect(answer).toContain("https://councilof.ai/watchdog/");
    expect(answer).not.toContain("tab=watchdog");
    expect(answer).toContain("not a staffed incident-response service");
    expect(answer).toContain("Do not put private incident details");
  });

  it("separates MEOK navigation from model inference, permission and execution", () => {
    const answer = guidanceAnswer("meok");
    expect(answer).toContain("https://councilof.ai/him/");
    expect(answer).toContain("tab=staff");
    expect(answer).toContain("not a live MEOK model response");
    expect(answer).toContain("no action was approved or executed");
    expect(answer).toContain("person's identity, authority");
  });

  it("explains the incident-reporting limit without inventing a case or recipient", () => {
    const answer = guidanceAnswer("incident-reporting");
    expect(answer).toContain("does not provide a staffed AI incident-reporting service");
    expect(answer).toContain("does not open a case or notify a reviewer");
    expect(answer).toContain("https://councilof.ai/watchdog/");
    expect(answer).not.toContain("mailto:");
  });

  it("does not emit fake tool lifecycle events for guidance", async () => {
    const onEvent = vi.fn();
    await executePlan({ kind: "help", intent: "guidance", topic: "getting-started" }, "https://councilof.ai", onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("streams a finished guidance answer through the actual Ask handler", async () => {
    const fetchSpy = vi.fn(() => { throw new Error("guidance must not fetch"); });
    vi.stubGlobal("fetch", fetchSpy);
    const response = serveAguiRun(new Request("https://councilof.ai/api/agui/run", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ id: "m1", role: "user", content: "What is MEOK and how can I use it?" }] }),
    }));
    const result = await response;
    expect(result.status).toBe(200);
    const body = await result.text();
    expect(body).toContain("RUN_FINISHED");
    expect(body).toContain("GUIDANCE");
    expect(body).toContain("https://councilof.ai/him/");
    expect(body).not.toContain("TOOL_CALL_START");
    expect(body).not.toContain("I could not match");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
