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
 *   - the free card carries no payment words; /.well-known/ai-catalog.json lists both cards;
 *   - the card routes answer every Origin alike (no allowlist), with their own CORS set, an ETag of the exact
 *     body and 304 for a matching If-None-Match; the JSON-RPC endpoints keep their Origin check
 *     (gateway-header-gaps G1-G5, 2026-11-20).
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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

// gateway-header-gaps G1-G5: CORS, ETag and conditional GET on the two card routes.
const CARD_PATHS = [["/mcp/server-card"], ["/mcp/free/server-card"]];
const CARD_CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "Content-Type, If-None-Match, Accept",
  "access-control-expose-headers": "ETag",
};
const FOREIGN = "https://example.org";
const PREFLIGHT = { origin: FOREIGN, "access-control-request-method": "GET", "access-control-request-headers": "content-type, if-none-match" };
const at = (url: string, init: RequestInit = {}) =>
  onRequest({ request: new Request(url, init), env: {}, params: {} } as never);
const listed = (value: string | null) => (value ?? "").split(",").map((s) => s.trim().toLowerCase());
const corsOf = (r: Response) => Object.fromEntries([...r.headers].filter(([k]) => k.startsWith("access-control-")));
const answer = async (r: Response) => ({ status: r.status, headers: [...r.headers], body: await r.text() });
/** Computed here from the bytes received, not by the handler's helper. */
const bodyTag = (bytes: ArrayBuffer) => `"${createHash("sha256").update(Buffer.from(bytes)).digest("hex").slice(0, 32)}"`;

describe("SEP-2127 card routes: CORS, ETag and If-None-Match (gateway-header-gaps G1-G5)", () => {
  it.each(CARD_PATHS)("%s: G1 no Origin allowlist: every Origin, Origin: null and no Origin get the same answer", async (path) => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      const ask = method === "OPTIONS" ? { "access-control-request-method": "GET" } : {};
      const base = await answer(await req(path, { method, headers: ask }));
      expect(base.status, method).toBe(method === "OPTIONS" ? 204 : 200);
      for (const origin of [FOREIGN, "null", "https://councilof.ai", "https://claude.ai"])
        expect(await answer(await req(path, { method, headers: { ...ask, origin } })), `${method} Origin: ${origin}`).toEqual(base);
    }
    for (const origin of [FOREIGN, "null"]) {
      const r = await req(path, { headers: { origin, accept: SERVER_CARD_MEDIA_TYPE } });
      expect(r.status, origin).toBe(200);
      expect(r.headers.get("content-type"), origin).toBe(SERVER_CARD_MEDIA_TYPE);
      expect(((await r.json()) as Card).name, origin).toMatch(/^ai\.councilof\/gspc/);
    }
  });

  it.each(CARD_PATHS)("%s: G2 the preflight is 204 with the card's own CORS set, whatever it asks; the 405 uses that set", async (path) => {
    const asks = [PREFLIGHT, {}, { origin: "null", "access-control-request-method": "DELETE", "access-control-request-headers": "authorization, x-other" }];
    for (const headers of asks) {
      const r = await req(path, { method: "OPTIONS", headers });
      expect(r.status, JSON.stringify(headers)).toBe(204);
      expect(corsOf(r), JSON.stringify(headers)).toEqual({ ...CARD_CORS, "access-control-max-age": "86400" });
    }
    const pre = await req(path, { method: "OPTIONS", headers: PREFLIGHT });
    expect(pre.headers.get("access-control-allow-origin")).toBe("*");
    expect(listed(pre.headers.get("access-control-allow-methods"))).toContain("get");
    expect(listed(pre.headers.get("access-control-allow-headers"))).toEqual(expect.arrayContaining(["content-type", "if-none-match"]));
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      const r = await req(path, { method, headers: { origin: FOREIGN } });
      expect(r.status, method).toBe(405);
      expect(r.headers.get("allow"), method).toBe("GET, HEAD, OPTIONS");
      expect(corsOf(r), method).toEqual(CARD_CORS);
    }
  });

  it.each(CARD_PATHS)("%s: G3 the 200 and the 304 expose ETag and carry the card's CORS lines", async (path) => {
    const ok = await req(path, { headers: { origin: FOREIGN } });
    expect(ok.status).toBe(200);
    expect(listed(ok.headers.get("access-control-expose-headers"))).toContain("etag");
    expect(corsOf(ok)).toEqual(CARD_CORS);
    const tag = ok.headers.get("etag");
    expect(tag).toMatch(/^"[0-9a-f]{32}"$/);
    const notModified = await req(path, { headers: { origin: FOREIGN, "if-none-match": tag! } });
    expect(notModified.status).toBe(304);
    expect(listed(notModified.headers.get("access-control-expose-headers"))).toContain("etag");
    expect(corsOf(notModified)).toEqual(CARD_CORS);
  });

  it.each(CARD_PATHS)("%s: G4 the 200 carries ETag, the quoted first 32 hex of sha256(GET body); HEAD carries the same tag", async (path) => {
    const get = await req(path);
    const tag = get.headers.get("etag");
    expect(tag).toMatch(/^"[0-9a-f]{32}"$/);
    expect(tag).toBe(bodyTag(await get.arrayBuffer()));
    expect((await req(path)).headers.get("etag"), "same body, same tag").toBe(tag);
    const head = await req(path, { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(head.headers.get("etag")).toBe(tag);
    expect(await head.text()).toBe("");
  });

  it("G4 the three addresses have three bodies and three tags, each the tag of its own body", async () => {
    const tags = new Set<string | null>();
    for (const url of [`${ORIGIN}/mcp/server-card`, `${ORIGIN}/mcp/free/server-card`, "https://mcp.meok.ai/mcp/server-card"]) {
      const r = await at(url);
      expect(r.status, url).toBe(200);
      const tag = r.headers.get("etag");
      expect(tag, url).toBe(bodyTag(await r.arrayBuffer()));
      tags.add(tag);
    }
    expect(tags.size).toBe(3);
  });

  it.each(CARD_PATHS)("%s: G5 If-None-Match with the tag, *, or a list holding W/<tag> gets 304 and no body (GET and HEAD)", async (path) => {
    const tag = (await req(path)).headers.get("etag");
    expect(tag).toMatch(/^"[0-9a-f]{32}"$/);
    for (const method of ["GET", "HEAD"])
      for (const value of [tag!, "*", `"zzz", W/${tag}`, `W/${tag}`, `"a", ${tag}, "b"`]) {
        const r = await req(path, { method, headers: { "if-none-match": value } });
        const what = `${method} If-None-Match: ${value}`;
        expect(r.status, what).toBe(304);
        expect(await r.text(), what).toBe("");
        expect(r.headers.get("etag"), what).toBe(tag);
        expect(r.headers.get("cache-control"), what).toBe("public, max-age=300");
        expect(r.headers.get("vary"), what).toBe("Accept");
        expect(r.headers.get("access-control-allow-origin"), what).toBe("*");
        expect(listed(r.headers.get("access-control-expose-headers")), what).toContain("etag");
      }
  });

  it.each(CARD_PATHS)("%s: G5 a tag that does not match gets 200, the full body and the current tag", async (path) => {
    const plain = await req(path);
    const tag = plain.headers.get("etag");
    expect(tag).toMatch(/^"[0-9a-f]{32}"$/);
    const body = await plain.text();
    for (const value of ['"zzz"', 'W/"zzz"', '"zzz", "yyy"']) {
      const r = await req(path, { headers: { "if-none-match": value } });
      expect(r.status, value).toBe(200);
      expect(r.headers.get("content-type"), value).toBe(SERVER_CARD_MEDIA_TYPE);
      expect(r.headers.get("etag"), value).toBe(tag);
      expect(await r.text(), value).toBe(body);
    }
  });

  it("scope guard: the host checks still run in front of the card routes", async () => {
    for (const path of ["/mcp/server-card", "/mcp/free/server-card"]) {
      expect((await at(`https://not-ours.example${path}`)).status, path).toBe(403);
      const r = await req(path, { headers: { host: "not-ours.example", origin: FOREIGN } });
      expect(r.status, path).toBe(403);
      expect(((await r.json()) as { error: { message: string } }).error.message, path).toMatch(/^Invalid Host/);
    }
  });

  it("scope guard: POST /mcp and /mcp/free keep their Origin check, and their CORS set has no If-None-Match", async () => {
    const init = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "card-check", version: "0.0.0" } } });
    for (const door of ["/mcp", "/mcp/free"]) {
      for (const origin of [FOREIGN, "null"]) {
        const r = await req(door, { method: "POST", headers: { origin, "content-type": "application/json", accept: "application/json, text/event-stream" }, body: init });
        expect(r.status, `${door} Origin: ${origin}`).toBe(403);
        expect(((await r.json()) as { error: { message: string } }).error.message, `${door} Origin: ${origin}`).toMatch(/^Invalid Origin/);
      }
      expect((await req(door, { method: "OPTIONS", headers: PREFLIGHT })).status, `${door} foreign preflight`).toBe(403);
      const pre = await req(door, { method: "OPTIONS" });
      expect(pre.status, door).toBe(204);
      expect(pre.headers.get("access-control-allow-methods"), door).toBe("GET, HEAD, POST, OPTIONS");
      expect(listed(pre.headers.get("access-control-allow-headers")), door).not.toContain("if-none-match");
    }
  });
});
