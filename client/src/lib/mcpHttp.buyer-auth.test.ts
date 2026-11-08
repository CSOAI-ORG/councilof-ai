// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mcpRpc } from "./mcpHttp";
const network = vi.fn<typeof fetch>();
beforeEach(() => { network.mockReset().mockImplementation(async (_input, init) => {
  const call = JSON.parse(String(init?.body));
  const result = call.method === "tools/list"
    ? { resultType: "complete", tools: [] }
    : { resultType: "complete", content: [{ type: "text", text: "synthetic complete reply" }], isError: false };
  return Response.json({ jsonrpc: "2.0", id: call.id, result });
}); vi.stubGlobal("fetch", network); });
afterEach(() => vi.unstubAllGlobals());
function headers(index = 0) { return new Headers(network.mock.calls[index][1]?.headers); }
describe("browser MCP authorization stays on its qualified transport", () => {
  it("uses only the same-origin full tool-call header with credentials omitted and redirects refused", async () => {
    await mcpRpc("tools/call", { name: "commission_card", arguments: { purchase_action: "history" } }, { buyerToken: "synthetic-session" });
    expect(network).toHaveBeenCalledOnce(); expect(String(network.mock.calls[0][0])).toBe("/mcp");
    expect(headers().get("authorization")).toBe("Bearer synthetic-session");
    expect(network.mock.calls[0][1]).toMatchObject({ credentials: "omit", redirect: "error" });
    expect(String(network.mock.calls[0][1]?.body)).not.toContain("synthetic-session");
  });
  it("never carries the session to the free door", async () => {
    await mcpRpc("tools/call", { name: "get_root", arguments: {} }, { door: "/mcp/free", buyerToken: "synthetic-session" });
    expect(String(network.mock.calls[0][0])).toBe("/mcp/free"); expect(headers().has("authorization")).toBe(false);
    expect(String(network.mock.calls[0][1]?.body)).not.toContain("synthetic-session");
  });
  it("never carries the session on either local or public read-only catalog fallback", async () => {
    network.mockImplementationOnce(async () => new Response("synthetic local catalog absent", { status: 404 }));
    await mcpRpc("tools/list", {}, { hostname: "localhost", allowPublicCatalogFallback: true, buyerToken: "synthetic-session" });
    expect(network).toHaveBeenCalledTimes(2);
    expect(String(network.mock.calls[1][0])).toBe("https://councilof.ai/mcp");
    for (let i = 0; i < 2; i++) { expect(headers(i).has("authorization")).toBe(false); expect(String(network.mock.calls[i][1]?.body)).not.toContain("synthetic-session"); }
  });
});
