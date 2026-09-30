/**
 * The measurement-capsule MCP tools, in the fleet. Since 2026-09-26 they are ordinary free tools in
 * gspc-tools.json (the MEASUREMENT_CAPSULE_TOOLS env gate is gone): listed with readOnlyHint and an
 * outputSchema, answering from the served layout through the real /mcp handler (the SDK validates
 * structuredContent against each outputSchema on the way out). tool-fleet.lock.test.ts proves every
 * other surface agrees with the fleet.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import LOCK from "./tool-fleet.lock.json";
import FREE from "./gspc-tools.json";
import { MEASUREMENT_TOOL_NAMES } from "./_measurement";
import BUNDLE from "../_lib/__fixtures__/measurement/layout-bundle.json";
import VECTORS from "../_lib/__fixtures__/measurement/capsule-vectors.json";

vi.setConfig({ testTimeout: 60_000 });
const FILES = (BUNDLE as { files: Record<string, string> }).files;
const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" };
afterEach(() => vi.unstubAllGlobals());

function serve(files: Record<string, string>) {
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    return path in files ? new Response(files[path]) : new Response("<!doctype html>", { status: 404 });
  });
}

type Msg = { result?: { tools?: Array<Record<string, unknown>>; structuredContent?: Record<string, unknown>; isError?: boolean; content?: Array<{ text: string }> }; error?: { message: string } };
async function rpc(method: string, params: Record<string, unknown>, env: Record<string, unknown> = {}): Promise<Msg> {
  const res = await onRequest({
    request: new Request("https://councilof.ai/mcp", { method: "POST", headers: HEADERS, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }),
    env,
  } as never);
  const text = await res.text();
  if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) return JSON.parse(text) as Msg;
  const frames = text.replace(/\r\n/g, "\n").split(/\n\n/).map((e) => e.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")).filter(Boolean);
  return JSON.parse(frames[frames.length - 1]) as Msg;
}
const NAMES = ["measurement_index", "verify_capsule", "server_evidence"];

describe("in the fleet: three free read-only tools, no env gate", () => {
  it("are free tools in gspc-tools.json and in the lock, in that order, after mcp_trust", () => {
    const free = FREE.tools.map((t) => t.name);
    const freeAnchor = free.indexOf("mcp_trust");
    const lockAnchor = LOCK.free.indexOf("mcp_trust");
    expect(freeAnchor).toBeGreaterThanOrEqual(0);
    expect(lockAnchor).toBeGreaterThanOrEqual(0);
    expect(free.slice(freeAnchor + 1, freeAnchor + 1 + NAMES.length)).toEqual(NAMES);
    expect(LOCK.free.slice(lockAnchor + 1, lockAnchor + 1 + NAMES.length)).toEqual(NAMES);
    expect([...MEASUREMENT_TOOL_NAMES]).toEqual(NAMES);
  });

  it("tools/list serves them with no env set — and an old gate value changes nothing", async () => {
    for (const env of [{}, { MEASUREMENT_CAPSULE_TOOLS: "off" }]) {
      const listed = await rpc("tools/list", {}, env);
      expect((listed.result?.tools ?? []).map((t) => t.name).sort()).toEqual([...LOCK.free, ...LOCK.paid].sort());
    }
  });

  it("public tool names never carry the internal architecture name", () => {
    expect(JSON.stringify(FREE.tools.filter((t) => NAMES.includes(t.name)))).not.toMatch(/venturi/i);
  });

  it("are listed with readOnlyHint, no destructive hint, and an outputSchema requiring state with doctrine a const", async () => {
    const listed = await rpc("tools/list", {});
    const tools = listed.result?.tools ?? [];
    for (const name of NAMES) {
      const t = tools.find((x) => x.name === name)! as { annotations: Record<string, unknown>; outputSchema: { required: string[]; properties: Record<string, { const?: string }> }; description: string };
      expect(t.annotations.readOnlyHint).toBe(true);
      expect(t.annotations.destructiveHint).toBe(false);
      expect(t.outputSchema.required).toEqual(["state"]);
      expect(t.outputSchema.properties.doctrine.const).toBe("measurement, not endorsement");
      expect(t.description).toMatch(/measurement, not endorsement/);
    }
  });

  it("measurement_index answers PUBLISHED from the served layout", async () => {
    serve(FILES);
    const r = await rpc("tools/call", { name: "measurement_index", arguments: {} });
    expect(r.result?.isError).toBe(false);
    expect(r.result?.structuredContent?.state).toBe("PUBLISHED");
  });

  it("verify_capsule answers INCLUDED for a published capsule's JSON text", async () => {
    serve(FILES);
    const line = (VECTORS as { v02: { lines: string[] } }).v02.lines[0];
    const r = await rpc("tools/call", { name: "verify_capsule", arguments: { capsule_json: line } });
    expect(r.result?.structuredContent?.state).toBe("INCLUDED");
  });

  it("server_evidence: MEASURED for a known endpoint; NOT_MEASURED (empty, not an error) for an unknown one", async () => {
    serve(FILES);
    const known = await rpc("tools/call", { name: "server_evidence", arguments: { endpoint_url: "https://svc1.example/mcp" } });
    expect(known.result?.structuredContent?.state).toBe("MEASURED");
    const unknown = await rpc("tools/call", { name: "server_evidence", arguments: { endpoint_url: "https://nobody.example/mcp" } });
    expect(unknown.result?.isError).toBe(false);
    expect(unknown.result?.structuredContent?.state).toBe("NOT_MEASURED");
    expect(unknown.result?.structuredContent?.capsules).toEqual([]);
  });

  it("nothing published: NOT_PUBLISHED, not an error", async () => {
    serve({});
    const r = await rpc("tools/call", { name: "measurement_index", arguments: {} });
    expect(r.result?.isError).toBe(false);
    expect(r.result?.structuredContent?.state).toBe("NOT_PUBLISHED");
  });
});
