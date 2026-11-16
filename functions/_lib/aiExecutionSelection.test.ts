import { describe, expect, it } from "vitest";
import { blockedAITools, DEFAULT_AI_EXECUTION as defaults, parseAIExecution, restrictAITools } from "./aiExecutionSelection";
describe("AI execution preferences", () => {
  it("distinguishes all tools from none and snapshots the list", () => {
    expect(blockedAITools(parseAIExecution(defaults), ["board_totals"])).toEqual([]);
    const tools: string[] = [];
    const parsed = parseAIExecution({ ...defaults, enabledTools: tools });
    tools.push("board_totals");
    expect(blockedAITools(parsed, ["board_totals", "board_totals"])).toEqual(["board_totals"]);
  });
  it.each(["offline", "local", "paired", "another-provider"])("rejects an unsupported route: %s", choice => {
    const changed = choice === "offline" ? { connectivity: choice } : choice === "another-provider" ? { provider: choice } : { host: choice };
    expect(() => parseAIExecution({ ...defaults, ...changed })).toThrow(/not connected/);
  });
  it.each([null, [], {}, { ...defaults, version: 2 }, { ...defaults, enabledTools: undefined },
    { ...defaults, apiKey: "never-accepted" }, { ...defaults, enabledTools: ["board_totals", "board_totals"] },
    { ...defaults, enabledTools: ["../../escape"] }])("rejects malformed preferences %#", value => {
    expect(() => parseAIExecution(value)).toThrow();
  });
  it("rejects a tool absent from the server catalogue", () => {
    expect(() => parseAIExecution({ ...defaults, enabledTools: ["stale_tool"] }, new Set(["board_totals"]))).toThrow(/no longer published/);
  });
  it("a confirmation cannot expand the old or current selection", () => {
    const old = { ...defaults, enabledTools: ["board_totals", "get_axis"] };
    expect(restrictAITools(old, { ...defaults, enabledTools: ["get_axis", "other"] }).enabledTools).toEqual(["get_axis"]);
    expect(restrictAITools(old, defaults).enabledTools).toEqual(old.enabledTools);
    expect(restrictAITools(defaults, { ...defaults, enabledTools: [] }).enabledTools).toEqual([]);
  });
});
