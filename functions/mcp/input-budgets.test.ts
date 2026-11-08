import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";

afterEach(() => vi.unstubAllGlobals());

function call(args: unknown, door = "/mcp/free", modern = true) {
  const network = vi.fn(() => {
    throw new Error("No downstream work expected");
  });
  vi.stubGlobal("fetch", network);
  const request = new Request(`https://councilof.ai${door}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(modern
        ? {
            "MCP-Protocol-Version": "2026-07-28",
            "Mcp-Method": "tools/call",
            "Mcp-Name": "verify_card",
          }
        : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "budget",
      method: "tools/call",
      params: {
        name: "verify_card",
        arguments: args,
        ...(modern
          ? {
              _meta: {
                "io.modelcontextprotocol/protocolVersion": "2026-07-28",
                "io.modelcontextprotocol/clientCapabilities": {},
              },
            }
          : {}),
      },
    }),
  });
  return { response: onRequest({ request }), network };
}

describe("MCP input budgets before validation or tool dispatch", () => {
  it.each(["/mcp", "/mcp/free"])(
    "rejects a wide, small-byte request at %s",
    async (door) => {
      const { response, network } = call(
        { card: { values: Array(25_001).fill(null) } },
        door,
      );
      const result = await response;
      expect(result.status).toBe(413);
      expect(result.headers.get("cache-control")).toBe("no-store");
      expect(await result.json()).toMatchObject({ error: { code: -32600 } });
      expect(network).not.toHaveBeenCalled();
    },
  );

  it("rejects deeply nested input without recursive validation", async () => {
    let card: unknown = null;
    for (let n = 0; n < 70; n++) card = [card];
    const { response, network } = call({ card });
    expect((await response).status).toBe(413);
    expect(network).not.toHaveBeenCalled();
  });

  it("enforces the SDK argument element budget below the lexical budget", async () => {
    const { response, network } = call({
      card: { values: Array(10_001).fill(null) },
    });
    const result = await response;
    expect(result.status).toBe(200);
    const message = (await result.json()) as {
      result: { isError?: boolean; content: Array<{ text: string }> };
    };
    expect(message.result.isError).toBe(true);
    expect(JSON.stringify(message)).toContain("maximum of 10000 elements");
    expect(network).not.toHaveBeenCalled();
  });

  it.each(["/mcp", "/mcp/free"])(
    "reports a JSON-string card budget as UNCHECKABLE at %s",
    async (door) => {
      const { response, network } = call(
        {
          card: JSON.stringify({ body: { values: Array(10_001).fill(null) } }),
        },
        door,
      );
      const result = await response;
      expect(result.status).toBe(200);
      expect(await result.json()).toMatchObject({
        result: {
          isError: false,
          structuredContent: {
            state: "UNCHECKABLE",
            reasons: ["input_budget_exceeded"],
          },
        },
      });
      expect(network).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])(
    "retains the 20 MiB base64 wire contract (modern=%s)",
    async (modern) => {
      const { response, network } = call(
        { card: "A".repeat(4 * Math.ceil((20 * 1024 * 1024) / 3)) },
        "/mcp/free",
        modern,
      );
      const result = await response;
      expect(result.status).toBe(200);
      const message = await result.json();
      expect(message).toHaveProperty("result");
      expect(JSON.stringify(message)).toContain("UNCHECKABLE");
      expect(network).not.toHaveBeenCalled();
    },
  );
});
