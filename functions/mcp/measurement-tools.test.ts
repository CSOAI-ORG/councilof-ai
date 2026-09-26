/**
 * The measurement-capsule MCP tools behind their env gate. Gate off: the K-1 fleet is exactly the
 * lock (tool-fleet.lock.test.ts proves the rest). Gate on: three free read-only tools with
 * readOnlyHint and an outputSchema, answering from the served layout through the real /mcp handler
 * (the SDK validates structuredContent against each outputSchema on the way out).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import LOCK from "./tool-fleet.lock.json";
import MEASUREMENT from "./measurement-tools.json";
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
async function rpc(method: string, params: Record<string, unknown>, env: Record<string, unknown>): Promise<Msg> {
  const res = await onRequest({
    request: new Request("https://councilof.ai/mcp", { method: "POST", headers: HEADERS, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }),
    env,
  } as never);
  const text = await res.text();
  if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) return JSON.parse(text) as Msg;
  const frames = text.replace(/\r\n/g, "\n").split(/\n\n/).map((e) => e.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")).filter(Boolean);
  return JSON.parse(frames[frames.length - 1]) as Msg;
}
const ON = { MEASUREMENT_CAPSULE_TOOLS: "on" };
const NAMES = MEASUREMENT.tools.map((t) => t.name);

describe("gate off (the default): the locked fleet, nothing more", () => {
  it("tools/list is exactly the lock and the measurement tools are not callable", async () => {
    const listed = await rpc("tools/list", {}, {});
    expect((listed.result?.tools ?? []).map((t) => t.name).sort()).toEqual([...LOCK.free, ...LOCK.paid].sort());
    const called = await rpc("tools/call", { name: "measurement_index", arguments: {} }, {});
    expect(called.result?.structuredContent).toBeUndefined();
  });
  it("public tool names never carry the internal architecture name", () => {
    expect(JSON.stringify(MEASUREMENT)).not.toMatch(/venturi/i);
    expect(NAMES).toEqual(["measurement_index", "verify_capsule", "server_evidence"]);
  });
});

describe("gate on: three free read-only tools", () => {
  it("are listed with readOnlyHint, no destructive hint, and an outputSchema requiring state + doctrine", async () => {
    const listed = await rpc("tools/list", {}, ON);
    const tools = listed.result?.tools ?? [];
    expect(tools.map((t) => t.name).sort()).toEqual([...LOCK.free, ...LOCK.paid, ...NAMES].sort());
    for (const name of NAMES) {
      const t = tools.find((x) => x.name === name)! as { annotations: Record<string, unknown>; outputSchema: { required: string[] }; description: string };
      expect(t.annotations.readOnlyHint).toBe(true);
      expect(t.annotations.destructiveHint).toBe(false);
      expect(t.outputSchema.required).toEqual(expect.arrayContaining(["state", "doctrine"]));
      expect(t.description).toMatch(/measurement, not endorsement/);
    }
  });

  it("measurement_index answers PUBLISHED from the served layout", async () => {
    serve(FILES);
    const r = await rpc("tools/call", { name: "measurement_index", arguments: {} }, ON);
    expect(r.result?.isError).toBe(false);
    expect(r.result?.structuredContent?.state).toBe("PUBLISHED");
  });

  it("verify_capsule answers INCLUDED for a published capsule's JSON text", async () => {
    serve(FILES);
    const line = (VECTORS as { v02: { lines: string[] } }).v02.lines[0];
    const r = await rpc("tools/call", { name: "verify_capsule", arguments: { capsule_json: line } }, ON);
    expect(r.result?.structuredContent?.state).toBe("INCLUDED");
  });

  it("server_evidence: MEASURED for a known endpoint; NOT_MEASURED (empty, not an error) for an unknown one", async () => {
    serve(FILES);
    const known = await rpc("tools/call", { name: "server_evidence", arguments: { endpoint_url: "https://svc1.example/mcp" } }, ON);
    expect(known.result?.structuredContent?.state).toBe("MEASURED");
    const unknown = await rpc("tools/call", { name: "server_evidence", arguments: { endpoint_url: "https://nobody.example/mcp" } }, ON);
    expect(unknown.result?.isError).toBe(false);
    expect(unknown.result?.structuredContent?.state).toBe("NOT_MEASURED");
    expect(unknown.result?.structuredContent?.capsules).toEqual([]);
  });

  it("nothing published: NOT_PUBLISHED, not an error", async () => {
    serve({});
    const r = await rpc("tools/call", { name: "measurement_index", arguments: {} }, ON);
    expect(r.result?.isError).toBe(false);
    expect(r.result?.structuredContent?.state).toBe("NOT_PUBLISHED");
  });
});
