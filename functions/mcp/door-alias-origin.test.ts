/**
 * A door alias reads and buys from the canonical origin (functions/mcp/[[path]].ts DOOR_ALIAS_ORIGINS).
 * Measured 20 Nov 2026: a paid tool's challenge on mcp.meok.ai named https://mcp.meok.ai/api/...,
 * a resource /.well-known/x402.json does not list. councilof.ai and local origins stay same-origin.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOOR_ALIAS_ORIGINS, onRequest } from "./[[path]]";

afterEach(() => vi.unstubAllGlobals());

const post = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify(body),
  });

/** Every subrequest a paid tools/call makes, by URL, with a route that answers 402. */
async function paidCallOn(door: string): Promise<string[]> {
  const seen: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const req = input instanceof Request ? input : new Request(String(input));
      seen.push(req.url);
      const challenge = { x402Version: 2, resource: { url: req.url }, accepts: [{ scheme: "exact", network: "eip155:8453", amount: "1", payTo: "0xpay" }] };
      return new Response(JSON.stringify(challenge), { status: 402, headers: { "content-type": "application/json" } });
    }),
  );
  const res = await onRequest({
    request: post(door, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "commission_card", arguments: { subject: "qwen3" } } }),
    env: {},
    params: {},
  } as never);
  const text = await res.text();
  expect(text).toContain("PAYMENT_REQUIRED");
  return seen.filter((u) => new URL(u).pathname.startsWith("/api/"));
}

describe("door aliases read and buy from the canonical origin", () => {
  it("the alias table names only mcp.meok.ai, and maps it to councilof.ai", () => {
    expect(DOOR_ALIAS_ORIGINS).toEqual({ "mcp.meok.ai": "https://councilof.ai" });
  });

  it("a paid call on mcp.meok.ai is forwarded to councilof.ai, so its challenge names a catalogued resource", async () => {
    const seen = await paidCallOn("https://mcp.meok.ai/mcp");
    expect(seen).toEqual(["https://councilof.ai/api/request-attestation?subject=qwen3"]);
  });

  it("councilof.ai and a local origin stay same-origin", async () => {
    expect(await paidCallOn("https://councilof.ai/mcp")).toEqual(["https://councilof.ai/api/request-attestation?subject=qwen3"]);
    expect(await paidCallOn("http://localhost:8788/mcp")).toEqual(["http://localhost:8788/api/request-attestation?subject=qwen3"]);
  });
});
