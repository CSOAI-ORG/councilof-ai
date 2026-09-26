import { afterEach, describe, expect, it, vi } from "vitest";
import { mcpTrustTool, partialOf } from "./_board";

/**
 * mcp_trust — a cap-limited read is PARTIAL. The 2026-09-14 snapshot (still latest on 2026-09-26)
 * says partial:false while its own enumeration says complete:false, stop_reason "cap reached",
 * 500 unique hosts of 1,854 registry rows with a remote. The tool now reads the enumeration too;
 * the producer (scripts/mcp-trust-round.py is_partial) is fixed for the next round.
 */
const SNAPSHOT = {
  kind: "csoai.mcp-trust-snapshot/0.1",
  as_of: "2026-09-14T10:38:01Z",
  partial: false,
  enumeration: { pages_fetched: 23, registry_rows_seen: 2244, rows_with_remote: 1854, unique_hosts: 500, cap: 500, complete: false, stop_reason: "cap reached" },
  counts: { total: 500 },
};

afterEach(() => vi.unstubAllGlobals());

describe("mcp_trust partial flag", () => {
  it("the shipped snapshot reads as partial, with the reason", () => {
    const p = partialOf(SNAPSHOT);
    expect(p.partial).toBe(true);
    expect(p.partial_reason).toMatch(/cap reached/);
    expect(p.partial_reason).toMatch(/500 hosts probed of 1854/);
  });

  it("a completed enumeration is not partial; a self-declared partial stays partial", () => {
    expect(partialOf({ partial: false, enumeration: { complete: true } })).toEqual({ partial: false, partial_reason: null });
    expect(partialOf({ partial: true, enumeration: { complete: true, stop_reason: "x" } }).partial).toBe(true);
  });

  it("the tool reports partial:true for the live-shaped snapshot", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(SNAPSHOT)));
    const out = (await mcpTrustTool("https://councilof.ai")) as { partial: boolean; enumeration: { complete: boolean } };
    expect(out.enumeration.complete).toBe(false);
    expect(out.partial).toBe(true);
  });

  it("control: the rule that shipped (d.partial ?? false) reported the cap-limited round as complete", () => {
    expect(SNAPSHOT.partial ?? false).toBe(false);
  });
});
