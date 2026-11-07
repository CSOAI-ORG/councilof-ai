import { afterEach, describe, expect, it, vi } from "vitest";
import { serveAguiRun, aguiDescriptor } from "./aguiRun";
import { DEFAULT_AI_EXECUTION, parseAIExecution } from "./aiExecutionSelection";
const origin = "https://council.example";
function request(execution: unknown, extra = {}) {
  return new Request(origin + "/api/agui/run", { method: "POST", body: JSON.stringify({
    messages: [{ role: "user", content: "Show the board" }],
    forwardedProps: { execution }, ...extra,
  }) });
}
afterEach(() => vi.unstubAllGlobals());
describe("server-enforced conversation tool selection", () => {
  it("advertises one real route and its exact selection scope", () => {
    const d = aguiDescriptor(origin) as any;
    expect(d.execution.provider).toBe("council-tools");
    expect(d.execution.tools).toContain("board_totals");
    expect(d.execution.unavailable).toContain("offline execution");
    expect(parseAIExecution({ ...DEFAULT_AI_EXECUTION, enabledTools: d.execution.tools }, new Set(d.execution.tools)).enabledTools).toEqual(d.execution.tools);
  });
  it.each([{ ...DEFAULT_AI_EXECUTION, connectivity: "offline" },
    { ...DEFAULT_AI_EXECUTION, host: "local" }, { ...DEFAULT_AI_EXECUTION, provider: "another-provider" },
    { ...DEFAULT_AI_EXECUTION, enabledTools: ["invented_tool"] }, null])("rejects unsupported settings before any tool fetch %#", async selection => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const response = await serveAguiRun(request(selection));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_execution_selection");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("None blocks the whole plan before tool events or fetches", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const text = await (await serveAguiRun(request({ ...DEFAULT_AI_EXECUTION, enabledTools: [] }))).text();
    expect(text).toContain("tools_disabled");
    expect(text).not.toContain("TOOL_CALL_START");
    expect(text).toContain("RUN_FINISHED");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("an enabled published tool reaches the existing MCP route once", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({ jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text: JSON.stringify({ axes: [], totals: {} }) }] } }));
    vi.stubGlobal("fetch", fetcher);
    const text = await (await serveAguiRun(request({ ...DEFAULT_AI_EXECUTION, enabledTools: ["board_totals"] }))).text();
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [target, init] = fetcher.mock.calls[0];
    expect(String(target instanceof Request ? target.url : target)).toMatch(/\/api\/gspc|\/mcp/);
    expect(text).toContain("RUN_FINISHED");
  });
  it("omitted execution preserves the existing protocol descriptor and unknown-question response", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const response = await serveAguiRun(new Request(origin + "/api/agui/run", {
      method: "POST", body: JSON.stringify({ message: "a question with no matched instrument" }),
    }));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("RUN_FINISHED");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
