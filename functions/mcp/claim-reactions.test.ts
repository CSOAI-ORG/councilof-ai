import { afterEach, describe, expect, it, vi } from "vitest";
import FREE from "./gspc-tools.json";
import { sharedToolResult } from "./_handlers";

afterEach(() => vi.unstubAllGlobals());

describe("claim_reactions: one verified read-only record across MCP", () => {
  it("advertises a read-only tool with a cursor and explicit state schema", () => {
    const tool = (FREE as { tools: Array<Record<string, any>> }).tools.find((t) => t.name === "claim_reactions")!;
    expect(tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, idempotentHint: true });
    expect(tool.inputSchema.properties.since.minimum).toBe(-1);
    expect(tool.outputSchema.required).toEqual(["state"]);
    expect(tool.description).toMatch(/does not.*admit/i);
  });

  it("returns the same verified projection, leaves freshness unevaluated and executes no other action", async () => {
    const fetch = vi.fn(async (input: string | URL | Request) => {
      expect(new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname).toBe("/api/claims/reactions");
      return Response.json({
        state: "LIVE", schema: "csoai.claim-reactions/0.1", source_verification: "VERIFIES",
        source_as_of: "2026-09-28T13:20:04Z", evidence_freshness: "NOT_EVALUATED",
        authority_state: "NONE", n_events: 1, n_counter_reaction_required: 1, reactions: [],
      });
    });
    vi.stubGlobal("fetch", fetch);
    const result = await sharedToolResult("claim_reactions", {}, "https://councilof.ai");
    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({ state: "LIVE", evidence_freshness: "NOT_EVALUATED", authority_state: "NONE" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBeInstanceOf(URL);
  });

  it("rejects an unverified payload and never substitutes cached data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ state: "LIVE", schema: "wrong", source_verification: "UNCHECKABLE" })));
    const result = await sharedToolResult("claim_reactions", {}, "https://councilof.ai");
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ state: "UNREACHABLE", error: "reaction_projection_not_verified" });
  });

  it("rejects malformed cursors without making a request", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const result = await sharedToolResult("claim_reactions", { since: 1.5 }, "https://councilof.ai");
    expect(result.isError).toBe(true);
    expect(result.structuredContent?.state).toBe("BAD_INPUT");
    expect(fetch).not.toHaveBeenCalled();
  });
});
