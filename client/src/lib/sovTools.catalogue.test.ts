import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("./mcpHttp", () => ({ mcpRpc: rpc, mcpRpcEndpoints: vi.fn() }));
beforeEach(() => { rpc.mockReset(); vi.resetModules(); });

describe("catalogue retry", () => {
  it("retains the normal failure TTL but an explicit retry reads the door again", async () => {
    const { listTools } = await import("./sovTools");
    rpc.mockResolvedValueOnce({ error: { message: "offline" } }).mockResolvedValueOnce({ result: { tools: [{ name: "get_axis", description: "Read one axis" }] } });
    expect((await listTools()).state).toBe("unreachable");
    expect((await listTools()).state).toBe("unreachable"); expect(rpc).toHaveBeenCalledOnce();
    expect(await listTools("/mcp", { force: true })).toMatchObject({ state: "ok", tools: [{ name: "get_axis" }] });
    expect(rpc).toHaveBeenCalledTimes(2);
    await listTools(); expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("keeps each door's listing separate when refreshing", async () => {
    const { listTools } = await import("./sovTools");
    rpc.mockResolvedValue({ result: { tools: [] } });
    await listTools("/mcp/free"); await listTools("/mcp"); await listTools("/mcp/free", { force: true });
    expect(rpc.mock.calls.map((call) => call[2].door)).toEqual(["/mcp/free", "/mcp", "/mcp/free"]);
  });
});
