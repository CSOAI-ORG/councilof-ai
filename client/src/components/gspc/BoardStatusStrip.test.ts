/**
 * The tools-door state in saved HTML (live, 18 Nov 2026). The static HTML of /assess/ and of
 * /dashboard/?tab=verify said "tools door not answering (retry shortly)" while POST /mcp/free
 * answered tools/list with 49 tools. The build's prerender (scripts/prerender.mjs sets
 * window.__CSOAI_PRERENDER__) had asked the door, and mcpRpc refuses every request there.
 */
import { describe, expect, it, vi } from "vitest";
import { readToolsDoor } from "./BoardStatusStrip";

describe("BoardStatusStrip tools-door read", () => {
  it("does not ask the door during the build's prerender, so the saved HTML keeps 'asking'", async () => {
    const list = vi.fn(async () => ({ state: "unreachable", reason: "MCP requests are disabled during prerender" }));
    expect(await readToolsDoor(list, { __CSOAI_PRERENDER__: true })).toBe("asking");
    expect(list).not.toHaveBeenCalled();
  });

  it("in a visitor's browser it asks /mcp/free and reports what the door answered", async () => {
    const answering = vi.fn(async () => ({ state: "ok", tools: [] }));
    expect(await readToolsDoor(answering, {})).toBe("answering");
    expect(answering).toHaveBeenCalledWith("/mcp/free");
    const down = vi.fn(async () => ({ state: "unreachable", reason: "HTTP 503" }));
    expect(await readToolsDoor(down, undefined)).toBe("not-answering");
  });
});
