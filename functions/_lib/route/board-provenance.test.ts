import { createHash } from "node:crypto";
import fs, { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { route } from "./route";
import { computeEventId } from "./evidence";
import { readBoardSource, MAX_BOARD_BYTES, BOARD_READ_TIMEOUT_MS } from "./board";
import { routeResult } from "../../mcp/_route";

const board = { schema: "csoai.gspc-axes/0.5", axes: [] };
const args = {
  task: "Route this public provenance control",
  objective: { quality_axis: "governance" },
  candidates: [{ id: "local:one", kind: "local_gpu", provider: "ollama", model: "one", endpoint: "local:ollama/one", read_only: true }],
};
const fixed = { now: () => new Date("2026-10-14T07:00:00Z"), uuid: () => "provenance-test" };
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const run = async (input: unknown) => {
  let reads = 0;
  const r = await route(args, { fetchBoard: async () => { reads++; return input; }, ...fixed });
  expect(r.state).not.toBe("BAD_ARGUMENTS");
  expect(reads).toBe(1);
  return r;
};
const record = (r: Awaited<ReturnType<typeof route>>) => r.record as Record<string, any>;
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("exact consumed board provenance", () => {
  it("hashes original UTF-8 bytes, preserving whitespace, Unicode and key order", async () => {
    const text = ' \n{"axes":[], "schema":"csoai.gspc-axes/0.5", "note":"é"}\n';
    const bytes = new TextEncoder().encode(text);
    const r = record(await run(new Response(bytes)));
    expect(r.observed.board.provenance).toMatchObject({
      artifact_sha256: digest(bytes), artifact_bytes: bytes.byteLength, schema: board.schema,
      version: null, as_of: null,
    });
    expect(r.observed.board.provenance.artifact_sha256).not.toBe(digest(new TextEncoder().encode(JSON.stringify(JSON.parse(text)))));
    expect(r.claim.read_at).toBe(fixed.now().toISOString());
    expect(r.event_id).toBe(await computeEventId(r));
  });

  it("equal JSON objects with different bytes have different artifact and route IDs", async () => {
    const compact = JSON.stringify(board), pretty = JSON.stringify(board, null, 2) + "\n";
    const a = await run(new Response(compact)), b = await run(new Response(pretty));
    expect(a.chosen).toEqual(b.chosen);
    expect(a.separation).toEqual(b.separation);
    expect(record(a).observed.board.provenance.artifact_sha256).not.toBe(record(b).observed.board.provenance.artifact_sha256);
    expect(record(a).event_id).not.toBe(record(b).event_id);
  });

  it("keeps a declared source instant/version separate from the route read time", async () => {
    const r = record(await run(new Response(JSON.stringify({ ...board, as_of: "2026-09-01T12:34:56.123456Z", version: "published-7" }))));
    expect(r.observed.board.provenance).toMatchObject({ as_of: "2026-09-01T12:34:56.123456Z", version: "published-7" });
    expect(r.claim.read_at).toBe("2026-10-14T07:00:00.000Z");
    expect(r.observed.board.provenance).not.toHaveProperty("fresh");
    expect(r.observed.board.provenance).not.toHaveProperty("model_version");
  });

  it.each([undefined, null, 42, {}, "2026-10-14", "2026-02-30T00:00:00Z", "2026-13-01T00:00:00Z", "2026-10-14T24:00:00Z"])(
    "keeps missing/malformed as_of unknown (%s)", async (as_of) => {
      const r = await readBoardSource(new Response(JSON.stringify({ ...board, as_of })));
      expect(r.provenance.as_of).toBeNull();
    },
  );

  it("keeps missing/malformed schema and version unknown", async () => {
    for (const value of [undefined, null, 42, {}, "", " padded ", "bad\nvalue", "x".repeat(257)]) {
      const r = await readBoardSource(new Response(JSON.stringify({ axes: [], schema: value, version: value })));
      expect(r.provenance.schema).toBeNull();
      expect(r.provenance.version).toBeNull();
    }
  });

  it("does not infer as_of or version from measured_on, nested facts or a schema suffix", async () => {
    const r = await readBoardSource(new Response(JSON.stringify({ ...board, measured_on: { date: "2026-09-01" }, financial: { facts_as_of: "2026-10-13T12:00:00Z" } })));
    expect(r.provenance).toMatchObject({ schema: board.schema, version: null, as_of: null });
  });

  it("legacy parsed objects retain declared metadata but no manufactured byte digest", async () => {
    const r = record(await run({ ...board, as_of: "2026-09-01T12:00:00Z" }));
    expect(r.observed.board.provenance).toEqual({
      schema: board.schema, version: null, as_of: "2026-09-01T12:00:00Z", as_of_field: "as_of", artifact_sha256: null, artifact_bytes: null,
    });
  });

  it("hashes only the supplied view and snapshots mutable input bytes", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(board));
    const framed = new Uint8Array(bytes.byteLength + 4); framed.set(bytes, 2);
    const view = framed.subarray(2, framed.length - 2);
    const pending = readBoardSource(view); view.fill(32);
    const r = await pending;
    expect(r.provenance.artifact_sha256).toBe(digest(bytes));
    expect(r.value).toEqual(board);
  });

  it("changed artifact provenance cannot reuse the route event ID", async () => {
    const r = record(await run(new Response(JSON.stringify(board))));
    const changed = structuredClone(r);
    changed.observed.board.provenance.artifact_sha256 = "0".repeat(64);
    expect(await computeEventId(changed)).not.toBe(r.event_id);
  });

  it("invalid JSON/UTF-8/HTTP bodies fail closed without a fabricated artifact hash", async () => {
    for (const input of [new Response("{"), new Response(new Uint8Array([0xff])), new Response("no", { status: 503 })]) {
      const r = record(await run(input));
      expect(r.observed.board).toMatchObject({ state: "UNREACHABLE", provenance: { artifact_sha256: null, artifact_bytes: null } });
    }
  });

  it.each([{}, { "content-length": "1" }, { "content-length": String(MAX_BOARD_BYTES + 1) }])(
    "caps streamed bytes with missing, lying or oversized content-length (%j)", async (headers) => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(MAX_BOARD_BYTES + 1)); },
      cancel() { cancelled = true; },
    });
    await expect(readBoardSource(new Response(stream, { headers }))).rejects.toThrow("byte limit");
    expect(cancelled).toBe(true);
    await expect(readBoardSource(new Uint8Array(MAX_BOARD_BYTES + 1))).rejects.toThrow("byte limit");
  });

  it("bounds a stalled body read", async () => {
    vi.useFakeTimers();
    const stream = new ReadableStream<Uint8Array>({ pull: () => new Promise(() => undefined) });
    const rejected = expect(readBoardSource(new Response(stream))).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(BOARD_READ_TIMEOUT_MS + 1);
    await rejected;
  });

  it("the actual MCP adapter forwards one existing response without reserialising it", async () => {
    const text = '{ "axes": [], "schema": "csoai.gspc-axes/0.5", "note": "é" }\n';
    let boardReads = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/api/gspc")) { boardReads++; return new Response(text); }
      return new Response("{}");
    }));
    const r = record(await routeResult(args, "https://council.test"));
    expect(boardReads).toBe(1);
    expect(r.observed.board.provenance.artifact_sha256).toBe(digest(new TextEncoder().encode(text)));
    const a2a = readFileSync(join(import.meta.dirname, "../../api/a2a.ts"), "utf8");
    expect(a2a).toContain('import { routeResult } from "../mcp/_route"');
    expect(a2a).toContain("await routeResult(input as Record<string, unknown>, origin)");
  });

  it("retained v0.1.0 receipt IDs still verify unchanged", async () => {
    const old = JSON.parse(readFileSync(join(import.meta.dirname, "__fixtures__/legacy-route-records-v0.1.0.json"), "utf8"));
    for (const item of old) {
      expect(digest(new TextEncoder().encode(item.source_text)), item.path).toBe(item.sha256);
      const receipt = JSON.parse(item.source_text);
      expect(receipt.method.version).toBe("0.1.0");
      expect(await computeEventId(receipt), item.path).toBe(receipt.event_id);
    }
  });
});

describe("production metadata and real pod seam", () => {
  it("production-shaped measured_on and per-axis measurement_time do not invent aggregate instants", async () => {
    const value = {
      schema: "csoai.gspc-axes/0.5",
      measured_on: { date: "2026-08-20", living_stamp: { as_of: "2026-10-13T12:00:00Z" } },
      measurement_time_contract: "API, build, deploy and readback times never refresh measurement",
      axes: [{ axis: "governance", measurement_time: { measured_at: "2026-08-20T00:00:00Z" } }],
    };
    const r = await readBoardSource(new Response(JSON.stringify(value)));
    expect(r.provenance).toMatchObject({ schema: value.schema, version: null, as_of: null, as_of_field: null });
  });

  it("supports either literal instant spelling and makes conflict/malformed dual declarations unknown", async () => {
    const a = "2026-09-01T12:00:00Z", b = "2026-09-02T12:00:00Z";
    for (const [fields, expected, source] of [
      [{ asOf: a }, a, "asOf"],
      [{ as_of: a }, a, "as_of"],
      [{ asOf: a, as_of: a }, a, "as_of+asOf"],
      [{ asOf: a, as_of: b }, null, null],
      [{ asOf: a, as_of: "bad" }, null, null],
    ] as const) {
      const r = await readBoardSource(new Response(JSON.stringify({ ...board, ...fields })));
      expect(r.provenance.as_of).toBe(expected);
      expect(r.provenance.as_of_field).toBe(source);
    }
  });

  it("cancels an unread non-OK HTTP body", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
    await expect(readBoardSource(new Response(stream, { status: 503 }))).rejects.toThrow("HTTP 503");
    expect(cancelled).toBe(true);
  });

  it("a stalled cancellation callback does not defeat the read bound", async () => {
    vi.useFakeTimers();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(MAX_BOARD_BYTES + 1)); },
      cancel() { return new Promise(() => undefined); },
    });
    const rejected = expect(readBoardSource(new Response(stream))).rejects.toThrow("byte limit");
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
  });

  it("the actual pod file adapter returns the bounded exact descriptor bytes", async () => {
    vi.stubEnv("BOARD_FILE", join(import.meta.dirname, "../../../fixtures/route-golden/board-2026-09-30.json"));
    vi.stubEnv("DISCOVERY_OFF", "1");
    vi.stubGlobal("fetch", vi.fn());
    const url = new URL("../../../services/gspc-router/route_service.mjs?file-provenance", import.meta.url).href;
    const pod = await import(/* @vite-ignore */ url);
    const input = await pod.fetchBoard();
    expect(input).toBeInstanceOf(Uint8Array);
    const r = await readBoardSource(input);
    expect(r.provenance.artifact_sha256).toBe(digest(readFileSync(process.env.BOARD_FILE!)));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("the actual pod network adapter forwards a single consumed response", async () => {
    vi.stubEnv("BOARD_FILE", "");
    vi.stubEnv("DISCOVERY_OFF", "1");
    const text = '{ "schema": "csoai.gspc-axes/0.5", "axes": [] }\n';
    const fetcher = vi.fn(async () => new Response(text));
    vi.stubGlobal("fetch", fetcher);
    const url = new URL("../../../services/gspc-router/route_service.mjs?network-provenance", import.meta.url).href;
    const pod = await import(/* @vite-ignore */ url);
    const input = await pod.fetchBoard();
    expect(input).toBeInstanceOf(Response);
    const r = await readBoardSource(input);
    expect(r.provenance.artifact_sha256).toBe(digest(new TextEncoder().encode(text)));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("the pod file adapter never reads beyond MAX_BOARD_BYTES+1", async () => {
    const dir = mkdtempSync(join(tmpdir(), "router-board-bound-"));
    const path = join(dir, "board.json");
    writeFileSync(path, new Uint8Array(MAX_BOARD_BYTES + 2));
    vi.stubEnv("BOARD_FILE", path);
    vi.stubEnv("DISCOVERY_OFF", "1");
    const reads = vi.spyOn(fs, "readSync");
    try {
      const url = new URL("../../../services/gspc-router/route_service.mjs?oversize-provenance", import.meta.url).href;
      const pod = await import(/* @vite-ignore */ url);
      await expect(pod.fetchBoard()).rejects.toThrow("byte limit");
      const consumed = reads.mock.results.reduce((n, result) => n + (result.type === "return" ? Number(result.value) : 0), 0);
      expect(consumed).toBe(MAX_BOARD_BYTES + 1);
    } finally { reads.mockRestore(); rmSync(dir, { recursive: true }); }
  });
});
