/**
 * K-1 fleet-size lock (2026-09-22).
 *
 * WHY THIS EXISTS. On 22 Sep the estate stated three different tool counts for one door:
 *   8  — GET /api/tools, derived from evidence/mcp-registry.json, a probe last run 2026-08-27
 *        against a PREVIOUS implementation of /mcp (measure · verify · jail-probe · enter-arena)
 *        plus a four-tool stdio package; nobody had re-run the probe in 26 days;
 *   12 — public/.well-known/mcp/server.json and public/.well-known/agents/index.json, typed
 *        before mcp_trust joined the free readers;
 *   13 — /tools and /products, derived at build time from gspc-tools.json + paid-tools.json,
 *        which is also what the live tools/list returned.
 * Three counts wearing one word. The lock is functions/mcp/tool-fleet.lock.json: NAMES, not a
 * number. Every surface below must agree with it, and this file is the one that goes red.
 *
 * The live comparison runs only with FLEET_LOCK_LIVE=1 (deploy.yml sets it after the deploy);
 * without it the case is reported SKIPPED, never silently green. With it, an unreachable door is
 * a failure — a check that cannot reach its subject has not checked anything.
 */
import { describe, expect, it } from "vitest";
import FREE from "./gspc-tools.json";
import PAID from "./paid-tools.json";
import LOCK from "./tool-fleet.lock.json";
import REGISTRY from "../../evidence/mcp-registry.json";
import WELLKNOWN_SERVER from "../../public/.well-known/mcp/server.json";
import AGENTS_INDEX from "../../public/.well-known/agents/index.json";
import REGISTRY_DESCRIPTOR from "../../mcp/gspc-server/server.json";
import NPM_PACKAGE from "../../mcp/gspc-server/package.json";
import { onRequest } from "./[[path]]";

type Named = { name: string };
const names = (doc: { tools: Named[] }) => doc.tools.map((t) => t.name);
const sorted = (xs: readonly string[]) => [...xs].sort();

const LOCK_FREE: string[] = LOCK.free;
const LOCK_PAID: string[] = LOCK.paid;
const LOCK_ALL: string[] = [...LOCK_FREE, ...LOCK_PAID];

const WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
  "nineteen", "twenty",
];

type ToolsList = { result?: { tools?: Named[] }; error?: { code: number; message: string } };

/** Decode a JSON or single-frame SSE JSON-RPC response. */
async function decode(response: Response): Promise<ToolsList> {
  const text = await response.text();
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("text/event-stream")) return JSON.parse(text) as ToolsList;
  const frames = text
    .replace(/\r\n/g, "\n")
    .split(/\n\n/)
    .flatMap((event) => {
      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""))
        .join("\n");
      return data && data !== "[DONE]" ? [JSON.parse(data) as ToolsList] : [];
    });
  const message = frames.find((m) => m.result?.tools) ?? frames.at(-1);
  if (!message) throw new Error("SSE response carried no JSON-RPC message");
  return message;
}

const RPC_BODY = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
const RPC_HEADERS = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
  "MCP-Protocol-Version": "2025-03-26",
};

describe("K-1 fleet-size lock: one list of names, every surface agrees", () => {
  it("the lock is well-formed and its size is derived from its names", () => {
    expect(LOCK.schema).toBe("csoai.mcp-tool-fleet-lock/1");
    expect(LOCK.door).toBe("https://councilof.ai/mcp");
    expect(new Set(LOCK_ALL).size).toBe(LOCK_ALL.length);
    expect(LOCK.fleet_size).toBe(LOCK_ALL.length);
    expect(LOCK_ALL).not.toContain("witness_hash");
  });

  it("the manifests the handler serves are exactly the lock", () => {
    expect(names(FREE as { tools: Named[] })).toEqual(LOCK_FREE);
    expect(names(PAID as { tools: Named[] })).toEqual(LOCK_PAID);
  });

  it("the in-process /mcp handler lists exactly the lock", async () => {
    const response = await onRequest({
      request: new Request("https://councilof.ai/mcp", {
        method: "POST",
        headers: RPC_HEADERS,
        body: RPC_BODY,
      }),
      env: {},
      params: {},
    } as never);
    const listed = await decode(response);
    expect(listed.error).toBeUndefined();
    expect(sorted((listed.result?.tools ?? []).map((t) => t.name))).toEqual(sorted(LOCK_ALL));
  });

  it("the committed probe is exact when it observed the current version, otherwise explicitly historical", () => {
    const servers = (REGISTRY as { servers: Array<{ id: string; status: string; alias_of: string | null; server_version?: string | null; last_probed?: string | null; tools?: Named[] }> }).servers;
    const probed = servers.filter((s) => s.status === "reachable" && !s.alias_of);
    expect(probed.map((s) => s.id)).toEqual(["csoai-gspc-mcp", "csoai-gspc-mcp-stdio"]);
    const current = probed.filter((s) => s.server_version === REGISTRY_DESCRIPTOR.version);
    for (const s of current) {
      expect(sorted((s.tools ?? []).map((t) => t.name)), `${s.id} current-version probe disagrees with the lock`).toEqual(sorted(LOCK_ALL));
    }
    for (const s of probed.filter((row) => row.server_version !== REGISTRY_DESCRIPTOR.version)) {
      expect(s.last_probed, `${s.id} historical probe must carry its observation time`).toBeTruthy();
      expect(s.server_version, `${s.id} historical probe must name the version it actually saw`).toBeTruthy();
      expect(s.server_version).not.toBe(REGISTRY_DESCRIPTOR.version);
    }
    if (current.length) {
      const distinct = new Set(current.flatMap((s) => (s.tools ?? []).map((t) => t.name)));
      expect(distinct.size).toBe(LOCK.fleet_size);
    } else {
      expect(probed.every((s) => s.server_version !== REGISTRY_DESCRIPTOR.version)).toBe(true);
    }
  });

  it("every descriptor that states a count states the locked one", () => {
    const all = LOCK_ALL.length;
    const free = LOCK_FREE.length;
    const paid = LOCK_PAID.length;
    expect(WELLKNOWN_SERVER.description).toContain(`${all} MCP tools: ${free} free + ${paid} x402`);
    expect(REGISTRY_DESCRIPTOR.description).toContain(`${all} HTTP tools (${free} free, ${paid} x402)`);
    expect(NPM_PACKAGE.description.toLowerCase()).toContain(
      `${WORDS[all]} tools: ${WORDS[free]} free readers and ${WORDS[paid]} x402-metered`,
    );
    const index = AGENTS_INDEX as { count: number; note: string; agents: Array<{ id: string; paid: boolean }> };
    expect(index.count).toBe(all);
    expect(index.agents).toHaveLength(all);
    expect(index.note).toContain(`${all} cards = the ${all} MCP tools`);
    expect(sorted(index.agents.map((a) => a.id))).toEqual(sorted(LOCK_ALL));
    expect(sorted(index.agents.filter((a) => a.paid).map((a) => a.id))).toEqual(sorted(LOCK_PAID));
  });

  it.skipIf(!process.env.FLEET_LOCK_LIVE)(
    "FLEET_LOCK_LIVE: the live door's tools/list is exactly the lock",
    async () => {
      const response = await fetch(LOCK.door, {
        method: "POST",
        headers: { ...RPC_HEADERS, "user-agent": "csoai-fleet-lock/1 (+https://councilof.ai/tools)" },
        body: RPC_BODY,
        signal: AbortSignal.timeout(20_000),
      });
      expect(response.status, `live door answered HTTP ${response.status}`).toBe(200);
      const listed = await decode(response);
      expect(listed.error, "live door returned a JSON-RPC error").toBeUndefined();
      expect(sorted((listed.result?.tools ?? []).map((t) => t.name))).toEqual(sorted(LOCK_ALL));
    },
    30_000,
  );
});
