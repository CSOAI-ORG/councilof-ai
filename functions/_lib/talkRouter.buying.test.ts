import { afterEach, describe, expect, it, vi } from "vitest";
import { executePlan, routeIntent } from "./talkRouter";
import { onRequestPost as chat } from "../api/chat";

/**
 * Sell organ SG-07 (7 Oct 2026): "How do I buy an Article 50 evidence pack and get an invoice?" names
 * an obligation AND asks how to buy. routeIntent sent it to evidence_bundle_preview (a card count),
 * because the obligation rule ran first and BUY_INTENT was only tested later, inside the chat
 * fallback. A buying question is now tested before obligationOf().
 */
const Q = "How do I buy an Article 50 evidence pack and get an invoice?";

afterEach(() => vi.unstubAllGlobals());

describe("a buying question reaches the buying statement before obligation matching", () => {
  it("routes the measured question, and its obvious variants, to the buying statement", () => {
    expect(routeIntent(Q)).toEqual({ kind: "help", intent: "buying" });
    for (const q of [
      "Can we pay for the DORA evidence bundle by invoice?",
      "how do we purchase article 53 evidence?",
      "Do you issue a VAT invoice for the CRA evidence bundle?",
      "can I get a quote for article 50 evidence",
    ])
      expect(routeIntent(q), q).toEqual({ kind: "help", intent: "buying" });
  });

  it("leaves free obligation questions and URL-named paid questions on their tools", () => {
    expect(routeIntent("which signed evidence is there for DORA")).toMatchObject({ kind: "tools", calls: [{ tool: "evidence_bundle_preview", args: { obligation: "dora" } }] });
    expect(routeIntent("evidence for Article 50")).toMatchObject({ kind: "tools", calls: [{ tool: "evidence_bundle_preview", args: { obligation: "article-50" } }] });
    // a buying question that names the output keeps the door: its 402 carries both ways to pay
    expect(routeIntent("buy article 50 marking evidence for https://cdn.example/x.png")).toMatchObject({
      kind: "tools",
      calls: [{ tool: "art50_marking_evidence", args: { url: "https://cdn.example/x.png" } }],
    });
    // "commission" is the paid-tool rule, unchanged
    expect(routeIntent("commission a card for https://example.com/mcp")).toMatchObject({ kind: "tools", calls: [{ tool: "commission_card" }] });
  });

  it("a question that only MENTIONS buying, or names a model, keeps master's route (repair round, 7 Oct 2026)", () => {
    // The first cut tested BUY_INTENT before obligationOf(); these four lost their tools to the buying
    // statement. Each expectation is the route master (fe1077498) gives the same question.
    expect(routeIntent("Which signed evidence is there for DORA procurement?")).toMatchObject({
      kind: "tools",
      calls: [{ tool: "evidence_bundle_preview", args: { obligation: "dora" } }],
    });
    expect(routeIntent("what does article 50 require about invoicing deepfakes")).toMatchObject({ kind: "needs_input", tool: "art50_marking_evidence" });
    expect(routeIntent("buy a signed card for llama3.2:3b")).toMatchObject({ kind: "tools", calls: [{ tool: "model_lookup", args: { model: "llama3.2:3b" } }] });
    expect(routeIntent("how do I get a quote for a fresh run of mistral")).toMatchObject({ kind: "tools", calls: [{ tool: "model_lookup", args: { model: "mistral" } }] });
  });

  it("A2A / AG-UI path: executePlan answers with the published statement, calls no tool and claims no tool answer", async () => {
    const t = await executePlan(routeIntent(Q), "https://councilof.ai");
    expect(t.answer).toContain("GBP invoice");
    expect(t.answer).toContain("nicholas@csoai.org");
    expect(t.tool_calls).toEqual([]);
    expect(t.grounded).toBe(false);
    expect(t.intent).toBe("buying");
  });

  it("POST /api/chat answers it with text containing 'GBP invoice', not an evidence-bundle card count", async () => {
    // The board read fails here on purpose: the buying statement must not depend on it.
    vi.stubGlobal("fetch", async () => new Response("unavailable", { status: 503 }));
    const res = await chat({
      request: new Request("https://councilof.ai/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: Q }),
      }),
      env: {},
      params: {},
      waitUntil: () => {},
    } as never);
    expect(res.status).toBe(200);
    const b = (await res.json()) as { answer: string; tool_calls?: { tool: string }[] };
    expect(b.answer).toContain("GBP invoice");
    expect(b.answer).not.toMatch(/relevant_signed_cards/);
    expect(b.tool_calls ?? []).toEqual([]);
  });
});
