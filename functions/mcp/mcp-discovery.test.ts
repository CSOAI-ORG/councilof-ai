import { describe, expect, it } from "vitest";
import REGISTRY_DESCRIPTOR from "../../mcp/gspc-server/server.json";
import NPM_PACKAGE from "../../mcp/gspc-server/package.json";
import { onRequest } from "./[[path]]";
import FREE from "./gspc-tools.json";
import PAID from "./paid-tools.json";

const ORIGIN = "https://councilof.ai";

async function post(method: string, params: unknown = {}) {
  const response = await onRequest({
    request: new Request(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
    env: {},
    params: {},
  } as never);
  return response.json();
}

describe("MCP discovery keeps implementation identities truthful", () => {
  it("returns the HTTP runtime version from initialize, not a regex over source", async () => {
    const initialized = await post("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "release-test", version: "1" },
    });

    expect(initialized.result.serverInfo).toEqual({
      name: "csoai-gspc-mcp",
      version: "1.3.0",
    });
    expect(initialized.result.serverInfo.version).not.toBe(NPM_PACKAGE.version);
    expect(initialized.result.serverInfo.version).toBe(
      REGISTRY_DESCRIPTOR.version,
    );
    expect(initialized.result.instructions).toMatch(
      /registry server\.version identifies this pages http implementation/i,
    );
    expect(initialized.result.instructions).toMatch(
      /402 challenge is not settlement, delivery or revenue/i,
    );
  });

  it("keeps GET discovery and JSON-RPC initialize on the same HTTP identity", async () => {
    const discovery = await (
      await onRequest({
        request: new Request(`${ORIGIN}/mcp`),
        env: {},
        params: {},
      } as never)
    ).json();
    const initialized = await post("initialize");

    expect(discovery.server_info).toEqual({
      ...initialized.result.serverInfo,
      release_train: "pages-http",
    });
    expect(discovery.stdio_alternative).toMatch(/released independently/i);
    expect(discovery.paid_tools.how).toMatch(
      /challenge is not settlement, delivery or revenue/i,
    );
  });

  it("derives the remote count from the definitions served by tools/list", async () => {
    const listed = await post("tools/list");
    const freeCount = (FREE as { tools: unknown[] }).tools.length;
    const paidCount = (PAID as { tools: unknown[] }).tools.length;

    expect(listed.result.tools).toHaveLength(freeCount + paidCount);
    expect([freeCount, paidCount]).toEqual([7, 4]);
    expect(REGISTRY_DESCRIPTOR.description).toContain(
      `${freeCount + paidCount} HTTP tools (${freeCount} free, ${paidCount} x402)`,
    );
    expect(
      (PAID as { tools: { name: string }[] }).tools.map((tool) => tool.name),
    ).not.toContain("witness_hash");
  });

  it("uses a new registry descriptor without pretending it is already published", () => {
    expect(REGISTRY_DESCRIPTOR.version).toBe("1.3.0");
    expect(REGISTRY_DESCRIPTOR.version).not.toBe(NPM_PACKAGE.version);
    expect(REGISTRY_DESCRIPTOR.description.length).toBeLessThanOrEqual(100);
    expect(REGISTRY_DESCRIPTOR.description).toMatch(/measure, never certify/i);
  });

  it("does not echo a protocolVersion this door does not speak", async () => {
    // A green tick that accepted the client's 2025-03-26 would claim a
    // redesign we have not implemented. The discovery catalog date
    // (2026-07-28 on /.well-known/mcp.json) is a different namespace.
    const newer = await post("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "newer-client", version: "0" },
    });
    expect(newer.result.protocolVersion).toBe("2024-11-05");
    expect(newer.result.protocolVersion).not.toBe("2025-03-26");

    const pin = await post("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "pin-client", version: "0" },
    });
    expect(pin.result.protocolVersion).toBe("2024-11-05");
  });
});
