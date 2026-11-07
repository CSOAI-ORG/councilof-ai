// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const transport = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("./mcpHttp", () => ({ mcpRpc: transport.rpc, mcpRpcEndpoints: () => ["/mcp"] }));
import { callTool } from "./sovTools";
const original = { result: { content: [{ type: "text", text: "synthetic-private-original" }], isError: false } };
beforeEach(() => { localStorage.clear(); localStorage.setItem("csoai_token", "synthetic-owner-a"); transport.rpc.mockReset(); });
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
describe("captured buyer session through a pending MCP reply", () => {
  it("returns an unchanged owner's actual reply through one transport call", async () => {
    transport.rpc.mockResolvedValue(original);
    const result = await callTool("commission_card", { purchase_action: "recover", purchase_transaction: "synthetic-tx" });
    expect(result.ok).toBe(true); expect(result.text).toBe("synthetic-private-original");
    expect(transport.rpc).toHaveBeenCalledOnce();
    expect(transport.rpc).toHaveBeenCalledWith("tools/call",
      { name: "commission_card", arguments: { purchase_action: "recover", purchase_transaction: "synthetic-tx" } }, { buyerToken: "synthetic-owner-a" });
  });
  it("discards a held private reply after the stored token changes without redispatching", async () => {
    let release!: (value: typeof original) => void;
    transport.rpc.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const pending = callTool("commission_card", { purchase_action: "recover", purchase_transaction: "synthetic-tx" });
    localStorage.setItem("csoai_token", "synthetic-owner-b"); // no event, so only the action-time check can protect this
    release(original);
    const result = await pending;
    expect(result.ok).toBe(false); expect(result.raw).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("synthetic-private-original");
    expect(result.text).toContain("session changed"); expect(result.text).toContain("original account");
    expect(transport.rpc).toHaveBeenCalledOnce();
  });
});
