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
      version: "1.4.1",
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
    expect([freeCount, paidCount]).toEqual([8, 4]);
    expect(REGISTRY_DESCRIPTOR.description).toContain(
      `${freeCount + paidCount} HTTP tools (${freeCount} free, ${paidCount} x402)`,
    );
    expect(
      (PAID as { tools: { name: string }[] }).tools.map((tool) => tool.name),
    ).not.toContain("witness_hash");
  });

  it("uses a new registry descriptor without pretending it is already published", () => {
    expect(REGISTRY_DESCRIPTOR.version).toBe("1.4.1");
    expect(REGISTRY_DESCRIPTOR.version).not.toBe(NPM_PACKAGE.version);
    expect(REGISTRY_DESCRIPTOR.description.length).toBeLessThanOrEqual(100);
    expect(REGISTRY_DESCRIPTOR.description).toMatch(/measure, never certify/i);
  });

  it("negotiates exactly the versions it speaks — current wire on offer, base pin otherwise", async () => {
    // The door now implements the 2026-07-28 wire (server/discover + the
    // resultType/ttlMs/cacheScope envelope). A 2026-07-28 client gets it; the
    // intermediate versions are still NOT implemented, so a 2025-03-26 client
    // is answered with the base pin — never an echo of a version it does not
    // speak. The discovery catalog date (schema_version on /.well-known/
    // mcp.json) is a different namespace from the JSON-RPC wire version.
    const current = await post("initialize", {
      protocolVersion: "2026-07-28",
      capabilities: {},
      clientInfo: { name: "current-client", version: "0" },
    });
    expect(current.result.protocolVersion).toBe("2026-07-28");
    expect(current.result.serverInfo.version).toBe("1.4.1");
    expect(current.result.instructions).toMatch(/registry server\.version identifies this pages http implementation/i);

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

    // _meta.protocolVersion carries the version in the 2026-07-28 shape.
    const viaMeta = await post("initialize", {
      protocolVersion: "2024-11-05",
      _meta: { protocolVersion: "2026-07-28" },
      capabilities: {},
      clientInfo: { name: "meta-client", version: "0" },
    });
    expect(viaMeta.result.protocolVersion).toBe("2026-07-28");
  });

  it("serves server/discover on the 2026-07-28 wire and stays quiet otherwise", async () => {
    await post("initialize", {
      protocolVersion: "2026-07-28",
      capabilities: {},
      clientInfo: { name: "disc-client", version: "0" },
    });
    const disc = await post("server/discover");
    expect(disc.result.serverInfo).toEqual({
      name: "csoai-gspc-mcp",
      version: "1.4.1",
    });
    expect(disc.result.capabilities).toEqual({ tools: {} });
  });

  it("adds the cache envelope to tool results on the 2026-07-28 wire", async () => {
    await post("initialize", {
      protocolVersion: "2026-07-28",
      capabilities: {},
      clientInfo: { name: "env-client", version: "0" },
    });
    const call = await post("tools/call", {
      name: "get_root",
      arguments: {},
    });
    expect(call.result.resultType).toBe("ToolResult");
    expect(call.result.ttlMs).toBeGreaterThan(0);
    expect(call.result.cacheScope).toBe("shared");
    expect(call.result.structuredContent).toBeTruthy();

    // The base pin keeps the classic shape — no envelope it never had.
    await post("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "env-client", version: "0" },
    });
    const baseCall = await post("tools/call", {
      name: "get_root",
      arguments: {},
    });
    expect(baseCall.result.resultType).toBeUndefined();
  });
});
