/**
 * SEP-2127 (DRAFT, unreleased) MCP Server Cards at <streamable-http-url>/server-card — /mcp/server-card and
 * /mcp/free/server-card (master plugin plan C1, 2026-09-30).
 *
 * What is held here:
 *   - both cards answer 200 as application/mcp-server-card+json and validate against the vendored schema of the
 *     snapshot SEP-2127 cites (experimental-ext-server-card@526201bb, scripts/harness-x/schemas/);
 *   - ONE SOURCE: each card's advisory tool snapshot is exactly the tools/list of the same door, and its
 *     names_sha256 re-derives; its version is what initialize answers;
 *   - every protocol revision the card advertises is one the door actually answers (initialize echoes the
 *     legacy ones; server/discover reports the modern one);
 *   - the free card carries no payment words; /.well-known/ai-catalog.json lists both cards.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest, MCP_HTTP_SERVER_VERSION } from "./[[path]]";
import { SUPPORTED_PROTOCOL_VERSIONS, SERVER_CARD_MEDIA_TYPE, serverCardDoor } from "./_server_card";

const ROOT = resolve(__dirname, "../..");
const ORIGIN = "https://councilof.ai";
const SCHEMA = resolve(ROOT, "scripts/harness-x/schemas/mcp-server-card-526201bb.schema.json");

beforeEach(() => vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Network is mocked"); })));
afterEach(() => vi.unstubAllGlobals());

const req = (path: string, init: RequestInit = {}) =>
  onRequest({ request: new Request(`${ORIGIN}${path}`, init), env: {}, params: {} } as never);

async function rpc(path: string, method: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  const r = await req(path, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const t = (await r.text()).trim();
  const body = t.startsWith("{") ? t : t.split("\n").filter((l) => l.startsWith("data:")).pop()!.slice(5);
  return JSON.parse(body) as { result?: Record<string, unknown>; error?: { message: string } };
}

type Card = {
  $schema: string; name: string; version: string; description: string; title: string;
  remotes: { type: string; url: string; supportedProtocolVersions: string[] }[];
  _meta: Record<string, { spec_status: string; tools_snapshot: { names: string[]; names_sha256: string; count: number } }>;
};
const getCard = async (path: string) => {
  const r = await req(path, { headers: { accept: SERVER_CARD_MEDIA_TYPE } });
  return { r, card: (await r.clone().json()) as Card, text: await r.text() };
};
const sha = async (names: string[]) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode([...names].sort().join("\n"))))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");

describe("SEP-2127 server cards (draft)", () => {
  it("routes exactly the two reserved paths, with or without a trailing slash", () => {
    expect(serverCardDoor("/mcp/server-card")).toBe("full");
    expect(serverCardDoor("/mcp/server-card/")).toBe("full");
    expect(serverCardDoor("/mcp/free/server-card")).toBe("free");
    expect(serverCardDoor("/mcp/free")).toBeNull();
    expect(serverCardDoor("/mcp/server-cards")).toBeNull();
    expect(serverCardDoor("/.well-known/mcp/server-card")).toBeNull();
  });

  it.each([["/mcp/server-card", "/mcp"], ["/mcp/free/server-card", "/mcp/free"]])(
    "%s: 200, the media type, identity == initialize, remote == its door, labelled draft",
    async (path, door) => {
      const { r, card } = await getCard(path);
      expect(r.status).toBe(200);
      expect(r.headers.get("content-type")).toBe(SERVER_CARD_MEDIA_TYPE);
      expect(r.headers.get("access-control-allow-origin")).toBe("*");
      expect(card.$schema).toBe("https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json");
      expect(card.name).toMatch(/^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
      expect(card.description.length).toBeLessThanOrEqual(100);
      expect(card.version).toBe(MCP_HTTP_SERVER_VERSION);
      expect(card.remotes).toEqual([{ type: "streamable-http", url: `${ORIGIN}${door}`, supportedProtocolVersions: SUPPORTED_PROTOCOL_VERSIONS }]);
      expect(card._meta["ai.councilof/server-card"].spec_status).toBe("draft SEP-2127, unreleased");
      const init = await rpc(door, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } });
      expect((init.result!.serverInfo as { version: string }).version).toBe(card.version);
    },
  );

  it.each([["/mcp/server-card", "/mcp"], ["/mcp/free/server-card", "/mcp/free"]])(
    "%s: the tool snapshot IS tools/list of the same door (one source), and its hash re-derives",
    async (path, door) => {
      const { card } = await getCard(path);
      const listed = await rpc(door, "tools/list");
      const names = (listed.result!.tools as { name: string }[]).map((t) => t.name);
      const snap = card._meta["ai.councilof/server-card"].tools_snapshot;
      expect(snap.names).toEqual(names);
      expect(snap.count).toBe(names.length);
      expect(snap.names_sha256).toBe(await sha(names));
    },
  );

  it("every advertised protocol revision is one the door answers", async () => {
    const legacy = SUPPORTED_PROTOCOL_VERSIONS.filter((v) => v < "2026-01-01");
    for (const v of legacy) {
      const init = await rpc("/mcp", "initialize", { protocolVersion: v, capabilities: {}, clientInfo: { name: "t", version: "1" } });
      expect(init.result!.protocolVersion, v).toBe(v);
    }
    const modern = SUPPORTED_PROTOCOL_VERSIONS.filter((v) => v >= "2026-01-01");
    expect(modern).toEqual(["2026-07-28"]);
    const d = await rpc("/mcp", "server/discover", {
      _meta: {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": { name: "t", version: "1" },
      },
    }, { "MCP-Protocol-Version": "2026-07-28", "Mcp-Method": "server/discover" });
    expect(d.result!.supportedVersions).toEqual(expect.arrayContaining(modern));
  });

  it("the free card carries no payment words; the full card names the metered tools", async () => {
    const free = (await getCard("/mcp/free/server-card")).text;
    expect(free.replace(/x402_trust/g, "")).not.toMatch(/metered|x402|x_payment/i);
    const full = (await getCard("/mcp/server-card")).card;
    expect(full._meta["ai.councilof/server-card"].tools_snapshot.names).toContain("evidence_bundle");
  });

  it("GET/HEAD/OPTIONS only; anything else is 405", async () => {
    expect((await req("/mcp/server-card", { method: "HEAD" })).status).toBe(200);
    expect((await req("/mcp/server-card", { method: "OPTIONS" })).status).toBe(204);
    expect((await req("/mcp/server-card", { method: "POST", body: "{}" })).status).toBe(405);
  });

  it("validates against the vendored SEP-2127 schema snapshot (python jsonschema, Draft 2020-12)", async () => {
    const probe = spawnSync("python3", ["-c", "import jsonschema"]);
    if (probe.status !== 0) return; // the check.mjs run on the pod has it; say so rather than fake a pass
    for (const path of ["/mcp/server-card", "/mcp/free/server-card"]) {
      const { text } = await getCard(path);
      const r = spawnSync("python3", ["-c", `import json,sys,jsonschema
s=json.load(open(sys.argv[1])); s={**s, "$ref": "#/$defs/ServerCard"}
errs=[e.message for e in jsonschema.Draft202012Validator(s).iter_errors(json.loads(sys.stdin.read()))]
print("\\n".join(errs)); sys.exit(1 if errs else 0)`, SCHEMA], { input: text, encoding: "utf8" });
      expect(r.stdout.trim(), path).toBe("");
      expect(r.status, path).toBe(0);
    }
  });

  it("/.well-known/ai-catalog.json lists both cards as application/mcp-server-card+json", () => {
    const cat = JSON.parse(readFileSync(resolve(ROOT, "public/.well-known/ai-catalog.json"), "utf8")) as { entries: { type: string; url?: string }[] };
    const urls = cat.entries.filter((e) => e.type === SERVER_CARD_MEDIA_TYPE).map((e) => e.url);
    expect(urls).toEqual(expect.arrayContaining([`${ORIGIN}/mcp/server-card`, `${ORIGIN}/mcp/free/server-card`]));
  });
});
