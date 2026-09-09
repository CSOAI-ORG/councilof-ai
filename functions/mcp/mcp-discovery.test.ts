import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import REGISTRY_DESCRIPTOR from "../../mcp/gspc-server/server.json";
import NPM_PACKAGE from "../../mcp/gspc-server/package.json";
import { onRequest } from "./[[path]]";
import FREE from "./gspc-tools.json";
import PAID from "./paid-tools.json";

const ORIGIN = "https://councilof.ai";
const LEGACY_PROTOCOL = "2025-03-26";

type Envelope = {
  jsonrpc: string;
  id?: unknown;
  result: {
    serverInfo: { name: string; version: string };
    instructions: string;
    tools: Array<{ name: string }>;
  };
  error?: { code: number; message: string };
};

async function decode(response: Response, id: unknown): Promise<Envelope> {
  const text = await response.text();
  if (
    !(response.headers.get("content-type") ?? "").includes("text/event-stream")
  ) {
    return JSON.parse(text) as Envelope;
  }
  const messages = text
    .replace(/\r\n/g, "\n")
    .split(/\n\n/)
    .flatMap((event) => {
      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""))
        .join("\n");
      return data && data !== "[DONE]" ? [JSON.parse(data) as Envelope] : [];
    });
  const message =
    messages.find((candidate) => candidate.id === id) ?? messages.at(-1);
  if (!message)
    throw new Error("SSE response did not contain a JSON-RPC result");
  return message;
}

async function post(method: string, params: unknown = {}) {
  const response = await onRequest({
    request: new Request(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": LEGACY_PROTOCOL,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
    env: {},
    params: {},
  } as never);
  return decode(response, 1);
}

const network = vi.fn();
beforeEach(() => {
  network.mockReset();
  network.mockRejectedValue(
    new Error("Network is mocked: unexpected subrequest"),
  );
  vi.stubGlobal("fetch", network);
});
afterEach(() => vi.unstubAllGlobals());

describe("MCP discovery keeps implementation identities truthful", () => {
  it("returns the HTTP runtime version from initialize, not a regex over source", async () => {
    const initialized = await post("initialize", {
      protocolVersion: LEGACY_PROTOCOL,
      capabilities: {},
      clientInfo: { name: "release-test", version: "1" },
    });

    expect(initialized.result.serverInfo).toEqual({
      name: "csoai-gspc-mcp",
      version: "1.4.2",
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
    const initialized = await post("initialize", {
      protocolVersion: LEGACY_PROTOCOL,
      capabilities: {},
      clientInfo: { name: "identity-test", version: "1" },
    });

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
    expect(REGISTRY_DESCRIPTOR.version).toBe("1.4.2");
    expect(REGISTRY_DESCRIPTOR.version).not.toBe(NPM_PACKAGE.version);
    expect(REGISTRY_DESCRIPTOR.description.length).toBeLessThanOrEqual(100);
    expect(REGISTRY_DESCRIPTOR.description).toMatch(/measure, never certify/i);
  });
});
