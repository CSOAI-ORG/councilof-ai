/**
 * quote_dataset_version (data/v1): a free read-only tool answering from the committed /data/v1 files
 * through the real /mcp handler (the SDK validates structuredContent against its outputSchema).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import LOCK from "./tool-fleet.lock.json";
import FREE from "./gspc-tools.json";

const ROOT = join(__dirname, "../../public");
const FILES: Record<string, string> = {};
const walk = (rel: string) => {
  for (const e of readdirSync(join(ROOT, rel), { withFileTypes: true }))
    e.isDirectory() ? walk(`${rel}/${e.name}`) : (FILES[`/${rel}/${e.name}`] = readFileSync(join(ROOT, rel, e.name), "utf8"));
};
walk("data/v1");
const LATEST = JSON.parse(FILES["/data/v1/latest.json"]);
const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" };
afterEach(() => vi.unstubAllGlobals());

function serve(files: Record<string, string>) {
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    return path in files ? new Response(files[path]) : new Response("<!doctype html>", { status: 404 });
  });
}
type Msg = { result?: { tools?: Array<Record<string, unknown>>; structuredContent?: Record<string, any>; isError?: boolean; content?: Array<{ text: string }> }; error?: { message: string } };
async function call(args: Record<string, unknown>): Promise<Msg> {
  const res = await onRequest({
    request: new Request("https://councilof.ai/mcp", { method: "POST", headers: HEADERS, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "quote_dataset_version", arguments: args } }) }),
    env: {},
  } as never);
  const text = await res.text();
  if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) return JSON.parse(text) as Msg;
  const frames = text.split(/\n\n/).map((e) => e.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("")).filter(Boolean);
  return JSON.parse(frames[frames.length - 1]) as Msg;
}

describe("quote_dataset_version", () => {
  it("is a free read-only tool in gspc-tools.json and the lock", () => {
    const def = FREE.tools.find((t) => t.name === "quote_dataset_version")!;
    expect(def.annotations.readOnlyHint).toBe(true);
    expect(LOCK.free).toContain("quote_dataset_version");
    expect(LOCK.paid).not.toContain("quote_dataset_version");
    expect(JSON.stringify(def)).not.toMatch(/\bcertif(y|ied)\b(?! anything)|price|usdc|\$\d/i);
  });

  it("defaults to latest and quotes the published version, sha and citation", async () => {
    serve(FILES);
    const r = await call({});
    const p = r.result!.structuredContent!;
    expect(r.result!.isError).toBe(false);
    expect(p.state).toBe("PUBLISHED");
    expect(p.version).toBe(LATEST.version);
    expect(p.is_latest).toBe(true);
    expect(p.card_count).toBe(LATEST.card_count);
    expect(p.manifest_sha256).toEqual({ published: LATEST.manifest_sha256, recomputed: LATEST.manifest_sha256, match: true });
    expect(p.files.length).toBeGreaterThan(0);
    for (const f of p.files) expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(p.citation.doi).toBeNull();
    expect(p.license).toBe("CC-BY-4.0");
    expect(JSON.stringify(p)).not.toMatch(/price|usdc/i);
  });

  it("quotes an explicit version and refuses an unknown or malformed one", async () => {
    serve(FILES);
    expect((await call({ version: LATEST.version })).result!.structuredContent!.state).toBe("PUBLISHED");
    expect((await call({ version: "1999-01-01" })).result!.structuredContent!.state).toBe("NOT_PUBLISHED");
    const bad = await call({ version: "../../signed" });
    expect(bad.result?.isError ?? !!bad.error).toBe(true);
  });

  it("flags a manifest whose bytes no longer match the published sha", async () => {
    const m = `${LATEST.manifest_url.replace("https://councilof.ai", "")}`;
    serve({ ...FILES, [m]: FILES[m] + " " });
    expect((await call({})).result!.structuredContent!.manifest_sha256.match).toBe(false);
  });

  it("says NOT_PUBLISHED when no data/v1 is served", async () => {
    serve({});
    expect((await call({})).result!.structuredContent!.state).toBe("NOT_PUBLISHED");
  });
});
