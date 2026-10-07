import { afterEach, describe, expect, it, vi } from "vitest";

import { ROUTABLE_TOOLS, callTool, executePlan, extractAxis, extractEndpoint, extractModel, routeIntent, talk } from "./talkRouter";
import { isConfirmed, lastUserText, serveAguiRun } from "./aguiRun";
import { ROUTER_READ_TOOLS } from "./talkReads";
import { onRequestPost as chatPost } from "../api/chat";
import { onRequestPost as a2aPost } from "../api/a2a";
import GSPC_TOOLS from "../mcp/gspc-tools.json";
import PAID_TOOLS from "../mcp/paid-tools.json";

const HEX = "ab".repeat(32);

const BOARD = {
  totals: {
    axes: 23,
    measured_axes: 23,
    unmeasured_axes: 0,
    public_count: "23 axis · 23 measured",
    separation_public_count: "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED",
  },
  axes: [{ axis: "safety", family: "gspc", status: "MEASURED", n: 36, accuracy: 0.9444, kind: "model-comparison" }],
  measured_on: {},
};

const MCP_TRUST = {
  kind: "csoai.mcp-trust-snapshot/0.1",
  as_of: "2026-09-14T10:38:01Z",
  enumeration: { unique_hosts: 500, complete: false, stop_reason: "cap reached" },
  partial: false,
  counts: { total: 500 },
  headline: "257 of 500 enumerated hosts answered a correct MCP initialize.",
};

const CORRECTIONS = {
  schema: "csoai.corrections/0.1", signature_state: "VALID",
  correction_latency: { exact: 1, upper_bound: 5, unmeasured: 80 },
  corrections: [
    { id: "C-1", date: "2026-09-28", status: "CORRECTED", reached_the_public: true, what_was_wrong: "old count", what_changed: "count corrected" },
    { id: "C-2", date: "2026-09-29", status: "OPEN", reached_the_public: false, what_was_wrong: "stale copy", what_changed: "review queued" },
  ],
};
const CLAIM_REGISTER = {
  schema: "csoai.claim-maintenance.register/0.1", as_of: "2026-09-25T11:08:49Z",
  totals: { subjects: 23, claims: 70 },
  states: { CURRENT: "maintained", SUPERSEDED: "retained history" },
  subjects: [{ id: "s1" }, { id: "s2" }], registries: [{ id: "r1" }],
  right_of_reply: { contact: "https://councilof.ai/contact/" },
  does_not_prove: ["truth", "compliance"],
};

/** A fetch stub that answers by path, records every request, and 404s anything else. */
function stubOrigin(extra: Record<string, (req: Request) => Response> = {}) {
  const seen: Request[] = [];
  const routes: Record<string, (req: Request) => Response> = {
    "/api/gspc": () => Response.json(BOARD),
    "/interop/mcp-trust/latest.json": () => Response.json(MCP_TRUST),
    "/api/corrections": () => Response.json(CORRECTIONS),
    "/api/claims/register": () => Response.json(CLAIM_REGISTER),
    ...extra,
  };
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(String(input), init);
    seen.push(req);
    const u = new URL(req.url);
    const h = routes[u.pathname];
    return h ? h(req) : new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fn);
  return seen;
}

afterEach(() => vi.unstubAllGlobals());

const ORIGIN = "https://councilof.ai";

describe("routeIntent — deterministic keyword/entity routing onto the /mcp tools", () => {
  const cases: [string, string[]][] = [
    ["what does the board say", ["board_totals"]],
    ["How many axes are measured?", ["board_totals"]],
    ["What does Council of AI measure?", ["board_totals"]],
    ["is cityalert.live trustworthy", ["server_evidence"]],
    ["check whether the mcp server at https://tapeperp.com/mcp is trustworthy", ["server_evidence"]],
    ["What is measured about github.com?", ["server_evidence"]],
    [`verify ${HEX}`, ["verify_card"]],
    [`is ${HEX} included in the root?`, ["verify_inclusion"]],
    [`get the leaf ${HEX}`, ["get_card"]],
    ["how did safety measure", ["get_axis"]],
    ["what about effect binding", ["get_axis"]],
    ["x402 census please", ["x402_trust"]],
    ["how many mcp servers answered", ["mcp_trust"]],
    ["show the measurement index", ["measurement_index"]],
    ["show corrections", ["corrections_summary"]],
    ["claim maintenance status", ["claim_maintenance_register"]],
    ["show the public root", ["get_root"]],
    ["list signed cards", ["list_cards"]],
    ["commission a card for https://example.com/mcp", ["commission_card"]],
    ["Which signed evidence is there for Article 50?", ["evidence_bundle_preview"]],
    ["What signed evidence is there for DORA?", ["evidence_bundle_preview"]],
    ["evidence for art. 53", ["evidence_bundle_preview"]],
    ["signed cards relevant to the Cyber Resilience Act", ["evidence_bundle_preview"]],
    ["article 50 marking evidence for https://example.com/image.png", ["art50_marking_evidence"]],
  ];
  it.each(cases)("%s -> %j", (q, tools) => {
    const plan = routeIntent(q);
    expect(plan.kind).toBe("tools");
    if (plan.kind === "tools") expect(plan.calls.map((c) => c.tool)).toEqual(tools);
  });

  it("routes only to tools POST /mcp lists (derived from gspc-tools.json + paid-tools.json), or to the two router reads", () => {
    const listed = new Set([...GSPC_TOOLS.tools, ...PAID_TOOLS.tools].map((t) => t.name));
    expect(ROUTABLE_TOOLS).toEqual(listed);
    // The router reads stay out of the /mcp fleet (K-1 lock): never listed, never a tool name there.
    for (const r of ROUTER_READ_TOOLS) expect(listed.has(r)).toBe(false);
    for (const [q] of cases) {
      const plan = routeIntent(q);
      if (plan.kind === "tools") for (const c of plan.calls) expect(listed.has(c.tool) || ROUTER_READ_TOOLS.has(c.tool)).toBe(true);
    }
  });

  it("extracts the entity, not just the topic", () => {
    const p = routeIntent("is cityalert.live trustworthy");
    expect(p.kind === "tools" && p.calls[0].args.endpoint_url).toBe("https://cityalert.live/mcp");
    const a = routeIntent("tell me about provenance controls");
    expect(a.kind === "tools" && a.calls[0].args.axis).toBe("provenance-controls");
    const v = routeIntent(`verify ${HEX.toUpperCase()}`);
    expect(v.kind === "tools" && v.calls[0].args.card).toBe(HEX);
  });

  it("does not read file names or version numbers as hosts", () => {
    expect(extractEndpoint("read root.json and agent-card.json")).toBeNull();
    expect(extractEndpoint("qwen2.5 on version 1.4.3")).toBeNull();
    expect(extractAxis("what is the weather")).toBeNull();
  });

  it("an unknown or unrelated question is help, never a guessed tool", () => {
    for (const q of ["measure all models", "please assess this", "what is the meaning of life", ""]) {
      expect(routeIntent(q).kind).toBe("help");
    }
  });

  // 6 Oct 2026: a server lookup used to add mcp_trust, so every lookup also printed a green VALID
  // census card about 500 other hosts. One server question is one call now; the census stays one
  // question away.
  it("a server question plans exactly one call, server_evidence", () => {
    const p = routeIntent("what is measured about github.com");
    expect(p.kind).toBe("tools");
    if (p.kind === "tools") {
      expect(p.calls).toHaveLength(1);
      expect(p.calls[0]).toMatchObject({ tool: "server_evidence", args: { endpoint_url: "https://github.com/mcp" } });
    }
    const census = routeIntent("mcp census");
    expect(census.kind === "tools" && census.calls.map((c) => c.tool)).toEqual(["mcp_trust"]);
  });

  it("an obligation question maps onto the evidence_bundle_preview schema enum", () => {
    const enumOf = (GSPC_TOOLS.tools.find((t) => t.name === "evidence_bundle_preview") as any).inputSchema.properties.obligation.enum;
    const asks: [string, string][] = [
      ["which signed evidence is there for article 50", "article-50"],
      ["evidence for Article-53", "article-53"],
      ["what signed evidence is there for DORA?", "dora"],
      ["signed records for the CRA", "cra"],
    ];
    for (const [q, obligation] of asks) {
      const p = routeIntent(q);
      expect(p.kind === "tools" && p.calls[0]).toMatchObject({ tool: "evidence_bundle_preview", args: { obligation } });
      expect(enumOf).toContain(obligation);
    }
  });

  it("a paid tool without its required argument asks for it instead of calling", () => {
    const p = routeIntent("commission a card");
    expect(p.kind).toBe("needs_input");
  });
});

describe("executePlan — answers carry the tool output, a citation and the state label", () => {
  it("board totals: tool name, source URL and the tool's own counts", async () => {
    stubOrigin();
    const a = await talk("what does the board say", ORIGIN);
    expect(a.grounded).toBe(true);
    expect(a.answered_by).toBe("tool:board_totals");
    expect(a.citations[0]).toMatchObject({ tool: "board_totals", url: `${ORIGIN}/api/gspc` });
    expect(a.label).toBe("MEASURED 23 of 23 slots");
    expect(a.answer).toContain("23 axis · 23 measured");
    expect(a.answer).toContain("tool `board_totals`");
  });

  it("an unreachable source is reported as UNREACHABLE with no number substituted", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    const a = await talk("what does the board say", ORIGIN);
    expect(a.label).toBe("UNREACHABLE");
    expect(a.answer).not.toMatch(/\b23\b/);
  });

  it("a domain question cites server_evidence only, adds no census card, and never grades trust", async () => {
    stubOrigin();
    const a = await talk("is cityalert.live trustworthy", ORIGIN);
    expect(a.grounded).toBe(true);
    expect(a.citations.map((c) => c.tool)).toEqual(["server_evidence"]);
    expect(a.answer).not.toContain("257 of 500 enumerated hosts");
    expect(a.answer).not.toMatch(/\b(is|are) (trustworthy|safe|untrustworthy)\b/i);
  });

  it("corrections are bounded, cited, and source signature is not reverified here", async () => {
    stubOrigin();
    const a = await talk("show corrections", ORIGIN);
    expect(a.grounded).toBe(true);
    expect(a.answered_by).toBe("tool:corrections_summary");
    expect(a.label).toBe("LIVE");
    expect(a.citations[0]).toMatchObject({ tool: "corrections_summary", url: `${ORIGIN}/api/corrections` });
    expect(a.answer).toContain("- count: 2");
    expect(a.answer).toContain("- signature_state_reported: VALID");
    expect(a.answer).toContain("- signature_verification: NOT_RUN");
    expect(a.answer).toContain("C-2");
  });

  // 6 Oct 2026: /api/corrections is newest-first, and correctionsSummary took rows.slice(-5).reverse(),
  // so "show corrections" listed the five OLDEST rows as recent. The fixture below has the live
  // order: newest first, published_at mostly "UNRECORDED", and a few older rows trailing in
  // ascending order at the end.
  it("corrections lists the newest rows first, whatever order the source tail is in", async () => {
    const row = (id: string, date: string, published_at = "UNRECORDED") => ({ id, date, published_at, status: "CORRECTED" });
    stubOrigin({
      "/api/corrections": () =>
        Response.json({
          ...CORRECTIONS,
          corrections: [
            row("C-2026-0930-12", "2026-09-30"),
            row("C-2026-0930-11", "2026-09-30"),
            row("C-2026-0930-01", "2026-09-30"),
            row("C-2026-0929-09", "2026-09-29"),
            row("C-2026-0927-05", "2026-09-27", "2026-09-27T03:52:54Z"),
            row("C-2026-0926-01", "2026-09-26", "2026-09-26T10:08:40Z"),
            row("C-2026-0819-13", "2026-08-19"),
            row("C-2026-0820-01", "2026-08-20"),
            row("C-2026-0822-01", "2026-08-22"),
          ],
        }),
    });
    const r = ((await callTool("corrections_summary", { limit: 5 }, ORIGIN)) as unknown as { structuredContent: Record<string, any> }).structuredContent;
    const recent = (r.recent ?? []) as { id: string }[];
    expect(recent.map((c) => c.id)).toEqual(["C-2026-0930-12", "C-2026-0930-11", "C-2026-0930-01", "C-2026-0929-09", "C-2026-0927-05"]);
    expect(r.count).toBe(9);
  });

  // The router's callTool lacked /mcp's evidence and route branches, so a routed
  // evidence_bundle_preview fell through to verify_card and came back UNCHECKABLE (6 Oct 2026).
  // Fixture fields are the ones GET /api/evidence-bundle?obligation=dora served that day.
  it("an obligation question is answered by evidence_bundle_preview itself, never a verify_card fallback", async () => {
    const seen = stubOrigin({
      "/api/evidence-bundle": () =>
        Response.json({
          schema: "csoai.evidence-bundle/0.1",
          kind: "preview",
          obligation: { id: "dora", control_id: "DORA-28-30", title: "DORA Art. 28-30 — ICT third-party risk oversight + Register of Information", counsel_confirmed: false },
          subject: null,
          relevant_signed_cards: 1,
          cards: [{ sha256: "0102dc8878b7136625760a4fa95909b64c2e97e92e9b68be59b66466494fde96", surface: "public.notice", as_of: "2026-09-12T09:23:55Z", url: "https://councilof.ai/cards/0102dc8878b71366.json" }],
          corpus: { as_of: "2026-09-30T05:05:34Z", read_from: "https://councilof.ai/cards-bundle.json" },
          relation: "relevant-to — never a determination",
          free_verify: "https://councilof.ai/gspc-verify",
        }),
    });
    const a = await talk("What signed evidence is there for DORA?", ORIGIN);
    expect(a.answered_by).toBe("tool:evidence_bundle_preview");
    expect(a.label).toBe("RELEVANT_CARDS_FOUND");
    expect(a.answer).toContain("- relevant_signed_cards: 1");
    expect(a.answer).toContain("- determination: NONE");
    expect(seen.some((q) => new URL(q.url).pathname === "/api/evidence-bundle" && new URL(q.url).searchParams.get("obligation") === "dora")).toBe(true);
  });

  it("Claim Maintenance is the public register summary, not a fresh measurement", async () => {
    stubOrigin();
    const a = await talk("claim maintenance status", ORIGIN);
    expect(a.grounded).toBe(true);
    expect(a.answered_by).toBe("tool:claim_maintenance_register");
    expect(a.label).toBe("LIVE");
    expect(a.citations[0]).toMatchObject({ tool: "claim_maintenance_register", url: `${ORIGIN}/api/claims/register` });
    expect(a.answer).toContain("2026-09-25T11:08:49Z");
    expect(a.answer).toContain("- subject_count: 2");
    expect(a.answer).toContain("- registry_count: 1");
  });

  it("help is not grounded and calls nothing", async () => {
    const seen = stubOrigin();
    const a = await talk("what is the meaning of life", ORIGIN);
    expect(a.grounded).toBe(false);
    expect(a.tool_calls).toEqual([]);
    expect(seen.length).toBe(0);
    expect(a.answer).toMatch(/could not match/);
  });

  it("never forwards x_payment: the paid route sees no X-PAYMENT header, and a 402 is reported as a challenge", async () => {
    const seen = stubOrigin({
      "/api/request-attestation": () =>
        Response.json({ x402Version: 2, error: "Payment required", accepts: [], resource: { url: `${ORIGIN}/api/request-attestation` } }, { status: 402 }),
    });
    const r = await callTool("commission_card", { subject: "https://example.com/mcp", x_payment: "SHOULD-NOT-PASS" }, ORIGIN);
    const paidReq = seen.find((q) => new URL(q.url).pathname === "/api/request-attestation");
    expect(paidReq).toBeDefined();
    expect(paidReq!.headers.get("x-payment")).toBeNull();
    expect(JSON.stringify(r)).not.toContain("SHOULD-NOT-PASS");

    const a = await executePlan(routeIntent("commission a card for https://example.com/mcp"), ORIGIN);
    expect(a.label).toBe("PAYMENT_REQUIRED");
    expect(a.answer).toMatch(/your own wallet/);
    expect(a.answer).toMatch(/nothing was charged/i);
  });
});

async function readEvents(res: Response): Promise<{ type: string; [k: string]: unknown }[]> {
  const text = await res.text();
  return text
    .split("\n\n")
    .map((b) => b.split("\n").find((l) => l.startsWith("data: ")))
    .filter((l): l is string => !!l)
    .map((l) => JSON.parse(l.slice(6)));
}

const aguiPost = (body: unknown) =>
  serveAguiRun(
    new Request(`${ORIGIN}/api/agui/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  );

describe("AG-UI run — streams RUN / TOOL_CALL / TEXT_MESSAGE events from the same router", () => {
  it("streams the full event sequence for a board question", async () => {
    stubOrigin();
    const res = await aguiPost({ threadId: "t1", runId: "r1", messages: [{ id: "m1", role: "user", content: "what does the board say" }] });
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
    const ev = await readEvents(res);
    expect(ev.map((e) => e.type)).toEqual([
      "RUN_STARTED",
      "TOOL_CALL_START",
      "TOOL_CALL_ARGS",
      "TOOL_CALL_END",
      "TOOL_CALL_RESULT",
      "CUSTOM",
      "TEXT_MESSAGE_START",
      ...ev.filter((e) => e.type === "TEXT_MESSAGE_CONTENT").map(() => "TEXT_MESSAGE_CONTENT"),
      "TEXT_MESSAGE_END",
      "RUN_FINISHED",
    ]);
    // The board card also arrives as an A2UI v0.9.1 surface (AG-UI CUSTOM event "a2ui").
    expect(ev[5]).toMatchObject({ name: "a2ui", value: { protocol: "A2UI", version: "v0.9.1", tool: "board_totals" } });
    expect((ev[5] as any).value.messages[0]).toHaveProperty("createSurface");
    expect(ev[0]).toMatchObject({ threadId: "t1", runId: "r1" });
    expect(ev[1]).toMatchObject({ toolCallName: "board_totals" });
    const result = JSON.parse(String(ev[4].content));
    expect(result.citation).toMatchObject({ tool: "board_totals" });
    expect(ev.at(-1)).toMatchObject({ type: "RUN_FINISHED", result: { grounded: true, answered_by: "tool:board_totals" } });
  });

  it("streams a corrections query through the same AG-UI tool events", async () => {
    stubOrigin();
    const ev = await readEvents(await aguiPost({ messages: [{ role: "user", content: "show corrections" }] }));
    expect(ev.find((e) => e.type === "TOOL_CALL_START")).toMatchObject({ toolCallName: "corrections_summary" });
    expect(ev.at(-1)).toMatchObject({ type: "RUN_FINISHED", result: { grounded: true, answered_by: "tool:corrections_summary" } });
  });

  it("a paid tool is NOT called without an explicit confirm event", async () => {
    const seen = stubOrigin();
    const ev = await readEvents(await aguiPost({ messages: [{ role: "user", content: "commission a card for https://example.com/mcp" }] }));
    expect(ev.some((e) => e.type === "TOOL_CALL_START")).toBe(false);
    expect(ev.find((e) => e.type === "CUSTOM")).toMatchObject({ name: "confirm_required" });
    expect(ev.at(-1)).toMatchObject({ type: "RUN_FINISHED", result: { awaiting_confirmation: true } });
    expect(seen.length).toBe(0);
  });

  it("with forwardedProps.confirm naming the tool, it returns the 402 challenge and still pays nothing", async () => {
    const seen = stubOrigin({
      "/api/request-attestation": () => Response.json({ x402Version: 2, error: "Payment required", accepts: [] }, { status: 402 }),
    });
    const ev = await readEvents(
      await aguiPost({
        messages: [{ role: "user", content: "commission a card for https://example.com/mcp" }],
        forwardedProps: { confirm: { tool: "commission_card" } },
      }),
    );
    expect(ev.find((e) => e.type === "TOOL_CALL_START")).toMatchObject({ toolCallName: "commission_card" });
    const result = JSON.parse(String(ev.find((e) => e.type === "TOOL_CALL_RESULT")!.content));
    expect(result.label).toBe("PAYMENT_REQUIRED");
    expect(seen.every((q) => q.headers.get("x-payment") === null)).toBe(true);
  });

  it("confirm must name the tool; an empty message is a RUN_ERROR", async () => {
    expect(isConfirmed({ forwardedProps: { confirm: { tool: "rwa_evidence" } } }, ["commission_card"])).toBe(false);
    expect(isConfirmed({}, [])).toBe(true);
    expect(lastUserText({ messages: [{ role: "user", content: [{ type: "text", text: "board" }] }] })).toBe("board");
    const ev = await readEvents(await aguiPost({ messages: [] }));
    expect(ev.map((e) => e.type)).toEqual(["RUN_STARTED", "RUN_ERROR"]);
  });

  it("GET describes the endpoint instead of 503", async () => {
    const res = await serveAguiRun(new Request(`${ORIGIN}/api/agui/run`));
    expect(res.status).toBe(200);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.events).toContain("RUN_STARTED");
  });
});

const a2aText = (text: string) =>
  a2aPost({
    request: new Request(`${ORIGIN}/api/a2a`, {
      method: "POST",
      headers: { "content-type": "application/json", "a2a-version": "1.0" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: { message: { messageId: "m1", role: "ROLE_USER", parts: [{ text }] } } }),
    }),
  } as never);

describe("the doors use the router: POST /api/chat and A2A plain text", () => {
  it("/api/chat answers a server question from server_evidence with a citation, not ungrounded", async () => {
    stubOrigin();
    const res = await chatPost({
      request: new Request(`${ORIGIN}/api/chat`, { method: "POST", body: JSON.stringify({ message: "is cityalert.live trustworthy" }) }),
      env: {},
    } as never);
    const j = (await res.json()) as Record<string, any>;
    expect(j.state).toBe("grounded");
    expect(j.answered_by).toBe("tool:server_evidence");
    expect(j.citations.map((c: any) => c.tool)).toEqual(["server_evidence"]);
    expect(j.model).toBeNull();
    expect(j.signature).toBeNull();
  });

  it("A2A SendMessage with plain text returns board_totals output", async () => {
    stubOrigin();
    const j = (await (await a2aText("what does the board say")).json()) as Record<string, any>;
    const data = j.result.message.parts[1].data;
    expect(data.kind).toBe("GROUNDED_TOOL_ANSWER");
    expect(data.answered_by).toBe("tool:board_totals");
    expect(j.result.message.parts[0].text).toContain("23 axis · 23 measured");
  });

  it("A2A plain text reaches the Claim Maintenance register through the same router", async () => {
    stubOrigin();
    const j = (await (await a2aText("claim maintenance status")).json()) as Record<string, any>;
    const data = j.result.message.parts[1].data;
    expect(data.kind).toBe("GROUNDED_TOOL_ANSWER");
    expect(data.answered_by).toBe("tool:claim_maintenance_register");
    expect(j.result.message.parts[0].text).toContain("2026-09-25T11:08:49Z");
  });

  // 29 Sep 2026: unplaced text is answered with a RESULT saying no tool matched (never guessed, never a
  // measurement). The old -32602 was recorded by a2aregistry.org as "Returning errors when contacted".
  it("A2A text the router cannot place is answered as unmatched, never guessed", async () => {
    const seen = stubOrigin();
    const j = (await (await a2aText("measure all models")).json()) as Record<string, any>;
    expect(j.error).toBeUndefined();
    const data = j.result.message.parts[1].data;
    expect(data).toMatchObject({ kind: "NO_TOOL_MATCHED", state: "unknown", tool_calls: [], citations: [] });
    expect(seen).toHaveLength(0);
  });
});

// Tools audit retest, 6 Oct 2026: "qwen3:8b", "Is gpt-4o safe?" and "Which model is best?" got
// "I could not match that question to a tool".
describe("a named model and the best-model question get grounded answers", () => {
  const MODELS = {
    models: [
      { id: "qwen3:8b", kind: "third_party", cards: 13, axes: 13 },
      { id: "qwen3:4b", kind: "third_party", cards: 21, axes: 20 },
      { id: "sov3-light", kind: "own", cards: 4, axes: 4 },
    ],
  };

  it("finds a model name in a question, and not in ordinary words", () => {
    expect(extractModel("qwen3:8b")).toBe("qwen3:8b");
    expect(extractModel("Is gpt-4o safe?")).toBe("gpt-4o");
    expect(extractModel("how did llama3.1:8b do")).toBe("llama3.1:8b");
    expect(extractModel("what is the philosophy here")).toBeNull();
    expect(extractModel("How did the jail (jailbreak) test measure?")).toBeNull();
    expect(extractModel("What does the leaderboard show?")).toBeNull();
  });

  it("routes a model to model_lookup and 'which is best' to the board, never naming a best model", () => {
    expect(routeIntent("qwen3:8b")).toMatchObject({ kind: "tools", calls: [{ tool: "model_lookup", args: { model: "qwen3:8b" } }] });
    expect(routeIntent("Is gpt-4o safe?")).toMatchObject({ kind: "tools", calls: [{ tool: "model_lookup", args: { model: "gpt-4o" } }] });
    expect(routeIntent("Which model is best?")).toMatchObject({ kind: "tools", calls: [{ tool: "board_totals" }] });
    expect(routeIntent("what is the safest AI model")).toMatchObject({ kind: "tools", calls: [{ tool: "board_totals" }] });
    expect(routeIntent("measure all models").kind).toBe("help");
    expect(ROUTER_READ_TOOLS.has("model_lookup")).toBe(true);
    expect(ROUTABLE_TOOLS.has("model_lookup")).toBe(false);
  });

  it("answers MEASURED with a count for a listed model and NOT_MEASURED for an unlisted one", async () => {
    stubOrigin({ "/interop/models-measured.json": () => Response.json(MODELS) });
    const hit = ((await callTool("model_lookup", { model: "qwen3:8b" }, ORIGIN)) as unknown as { structuredContent: Record<string, any> }).structuredContent;
    expect(hit).toMatchObject({ state: "MEASURED", model: "qwen3:8b", cards: 13, axes: 13, whose: "third party" });
    expect(hit.note).toMatch(/not a score/);
    const miss = ((await callTool("model_lookup", { model: "gpt-4o" }, ORIGIN)) as unknown as { structuredContent: Record<string, any> }).structuredContent;
    expect(miss).toMatchObject({ state: "NOT_MEASURED", model: "gpt-4o", cards: 0 });
    expect(miss.note).toMatch(/not a finding/);
  });
});

