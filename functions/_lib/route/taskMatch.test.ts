/**
 * GSPC Route over the default GSPC tool fleet: the request picks the tool whose purpose it names.
 *
 * Found 7 Oct 2026 (dashboard retest): with no candidates declared, the route tool chose by the
 * tie-break (declared cost, locality, then the id A-Z), so "which tool verifies a signed card" was
 * routed to board_totals. Every case below is a request a stranger would type.
 */
import { describe, expect, it } from "vitest";
import FREE from "../../mcp/gspc-tools.json";
import PAID from "../../mcp/paid-tools.json";
import { route, routeSummary, BANNED_ROUTE_WORDS, type RouteResult } from "./route";
import { PURPOSE, toolScore, namesEndpoint } from "./taskMatch";
import { computeEventId } from "./evidence";

const deps = {
  fetchBoard: async () => ({ axes: [] }),
  now: () => new Date("2026-10-07T04:00:00.000Z"),
  uuid: () => "00000000-0000-4000-8000-0000000007a5",
};
const ask = (task: string, extra: Record<string, unknown> = {}) => route({ task, ...extra }, deps);
const WALLET = { policy: { caller_wallet: true } };

const CASES: Array<[string, string, Record<string, unknown>?]> = [
  ["which tool verifies a signed card", "mcp:verify_card"],
  ["check that this card's signature is genuine", "mcp:verify_card"],
  ["how did safety measure", "mcp:get_axis"],
  ["what is the accuracy on the governance axis", "mcp:get_axis"],
  ["is example.com/mcp safe", "mcp:server_evidence"],
  ["what is measured about https://api.example.org/mcp", "mcp:server_evidence"],
  ["what are the board totals right now", "mcp:board_totals"],
  ["how many axes are measured on the board", "mcp:board_totals"],
  ["list the recent signed cards for governance", "mcp:list_cards"],
  ["is this hash included in the public merkle root", "mcp:verify_inclusion"],
  ["show me the latest public merkle root", "mcp:get_root"],
  ["get one card-v0 leaf from the public root", "mcp:get_card"],
  ["how many x402 payment doors answer a correct 402 challenge", "mcp:x402_trust"],
  ["how many MCP servers answer the initialize handshake", "mcp:mcp_trust"],
  ["verify this measurement capsule", "mcp:verify_capsule"],
  ["read the latest measurement capsule index", "mcp:measurement_index"],
  ["which signed evidence is there for DORA", "mcp:evidence_bundle_preview"],
  ["commission a measurement card for my model", "mcp:commission_card", WALLET],
  ["article 50 marking evidence for an image", "mcp:art50_marking_evidence", WALLET],
  ["evidence for a tokenized real-world asset on the XRP ledger", "mcp:rwa_evidence", WALLET],
  ["receipts batch from 2026-09-01", "mcp:receipts_batch", WALLET],
];

function routerText(r: RouteResult): string {
  return `${routeSummary(r)}\n${JSON.stringify(r)}`;
}

describe("route over the default tool fleet: the request's purpose decides", () => {
  for (const [task, want, extra] of CASES) {
    it(`"${task}" -> ${want}`, async () => {
      const r = await ask(task, extra);
      expect(r.state, routeSummary(r)).toBe("ROUTED");
      expect((r.chosen as { id: string }).id, JSON.stringify(r.task_match)).toBe(want);
      expect((r.chosen as { choice_basis: string }).choice_basis).toMatch(/^task_match/);
      expect((r.task_match as { state: string }).state).toBe("MATCHED");
      expect(routeSummary(r)).toContain(`ROUTED to ${want}: its purpose matches the request`);
    });
  }

  it("covers at least ten realistic requests", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(10);
  });

  it("a request no tool answers is UNTESTED: nothing is chosen, nothing by name order", async () => {
    for (const task of ["what is the weather in Paris tomorrow", "write me a poem about autumn", "hello"]) {
      const r = await ask(task);
      expect(r.state, task).toBe("UNTESTED");
      expect(r.chosen).toBeNull();
      expect((r.task_match as { state: string; matched: unknown[] }).state).toBe("UNTESTED");
      expect((r.task_match as { matched: unknown[] }).matched).toEqual([]);
      expect(routeSummary(r)).toMatch(/^UNTESTED: No tool's purpose matches this request/);
      expect(routeSummary(r)).not.toContain("board_totals");
    }
  });

  it("only task_sha256 sent: UNTESTED with the reason, never a guess", async () => {
    const r = await route({ task_sha256: "a".repeat(64) }, deps);
    expect(r.state).toBe("UNTESTED");
    expect(r.chosen).toBeNull();
    expect((r.task_match as { reason: string }).reason).toMatch(/Only task_sha256 was sent/);
  });

  it("a request that matches only a paid tool, without a wallet, names the tool and the policy that forbids it", async () => {
    const r = await ask("commission a measurement card for my model");
    expect(r.state).toBe("NO_PERMITTED_CANDIDATE");
    expect(r.chosen).toBeNull();
    const tm = r.task_match as { state: string; matched: Array<{ id: string; forbid_policy: string | null }> };
    expect(tm.state).toBe("MATCHED_FORBIDDEN");
    expect(tm.matched[0]).toMatchObject({ id: "mcp:commission_card", forbid_policy: "floor:paid-needs-caller-wallet" });
    expect(routeSummary(r)).toContain("mcp:commission_card, which the policy forbids (floor:paid-needs-caller-wallet)");
  });

  it("caller-declared candidates keep the caller's tie-break (no task matching)", async () => {
    const r = await ask("which tool verifies a signed card", {
      candidates: [
        { id: "mcp:get_axis", kind: "mcp_tool", provider: "csoai", endpoint: "https://councilof.ai/mcp/free", tool: "get_axis" },
        { id: "mcp:verify_card", kind: "mcp_tool", provider: "csoai", endpoint: "https://councilof.ai/mcp/free", tool: "verify_card" },
      ],
    });
    expect(r.task_match).toBeUndefined();
    expect((r.chosen as { choice_basis: string }).choice_basis).toMatch(/^tie_break:/);
  });

  it("the record carries the match, recomputes its event_id, and never the task text", async () => {
    const canary = "CANARY-41c9-do-not-store";
    const r = await ask(`which tool verifies a signed card ${canary}`);
    const rec = r.record as Record<string, any>;
    expect(rec.observed.task_match.state).toBe("MATCHED");
    expect(rec.observed.chosen.id).toBe("mcp:verify_card");
    expect(rec.event_id).toBe(await computeEventId(rec));
    expect(JSON.stringify(r)).not.toContain(canary);
    expect(routeSummary(r)).not.toContain(canary);
  });

  it("no router-written word says best, safest, recommended, compliant or certified, nor leader", async () => {
    for (const [task, , extra] of CASES) {
      const text = routerText(await ask(task, extra));
      expect(text, task).not.toMatch(BANNED_ROUTE_WORDS);
      expect(text.toLowerCase(), task).not.toContain("leader");
    }
    expect(routerText(await ask("write me a poem"))).not.toMatch(BANNED_ROUTE_WORDS);
  });

  it("every tool /mcp lists (except route itself) has purpose patterns", () => {
    const names = [...(FREE as { tools: { name: string }[] }).tools, ...(PAID as { tools: { name: string }[] }).tools]
      .map((t) => t.name)
      .filter((n) => n !== "route");
    for (const n of names) expect(PURPOSE[n], n).toBeDefined();
    for (const n of Object.keys(PURPOSE)) expect(names, n).toContain(n);
  });

  it("a score is 0 without a purpose hit, however many description words are shared", () => {
    expect(toolScore("board_totals", "slot count measured count kind")).toBe(0);
    expect(toolScore("verify_card", "verify a signed card")).toBeGreaterThan(5);
  });

  it("a file name is not a server", () => {
    expect(namesEndpoint("read root.json please")).toBe(false);
    expect(namesEndpoint("is example.com/mcp safe")).toBe(true);
  });
});
