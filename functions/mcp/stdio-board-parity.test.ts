/**
 * Compare the actual stdio JSON-RPC boundary with the existing HTTP board handlers.
 * Synthetic fixtures, loopback HTTP only: no live board, model inference or payments.
 * This catches transport drift, not statistical validity or model/tool-choice quality.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { boardTotalsTool, getAxisTool } from "./_board";

const ROOT = resolve(__dirname, "../..");
const readJson = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
const freeTools = readJson("functions/mcp/gspc-tools.json").tools;
const paidTools = readJson("functions/mcp/paid-tools.json").tools;
const descriptor = (name: string) => freeTools.find((tool: { name: string }) => tool.name === name);

function boardFixture() {
  return {
    measured_on: { date: "2026-01-02", note: "synthetic fixture; not a live measurement. ".repeat(300) },
    totals: {
      axes: 3, measured_axes: 2, unmeasured_axes: 1,
      public_count: "3 declared; 2 measured; 1 unmeasured",
      separation_public_count: "1 separated; 1 tie; 1 untested",
      comparison_axes: 3, separated_leads: 1, ties: 1, untested_separations: 1,
      count_grammar: { fixture: true }, by_family: { synthetic: 3 },
    },
    axes: [{
      axis: "governance", family: "synthetic", status: "MEASURED", n: 32,
      accuracy: 0.75, interval: [0.5, 0.9], leader: "fixture-model",
      separation: "TIE", kind: "synthetic-test", dataset: "fixture-bank",
      dataset_url: "/fixtures/bank.json", evidence_url: "/fixtures/evidence.json",
      facts_as_of: "2026-01-01T01:00:00Z", measurement_time: "2026-01-01T02:00:00Z",
    }],
  };
}

type Reply = { id?: number; error?: unknown; result?: any };
class StdioClient {
  child: ChildProcessWithoutNullStreams;
  nextId = 0;
  buffer = "";
  pending = new Map<number, { resolve: (reply: Reply) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  constructor(origin: string) {
    this.child = spawn(process.execPath, [resolve(ROOT, "mcp/gspc-server/index.mjs")], {
      cwd: ROOT,
      env: { ...process.env, GSPC_ORIGIN: origin },
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.child.stdout.setEncoding("utf8");
    this.child.stderr.resume();
    this.child.on("error", error => this.rejectAll(error));
    this.child.on("exit", () => this.rejectAll(new Error("stdio exited before replying")));
    this.child.stdout.on("data", (chunk: string) => {
      this.buffer += chunk;
      let newline: number;
      while ((newline = this.buffer.indexOf("\n")) >= 0) {
        const line = this.buffer.slice(0, newline); this.buffer = this.buffer.slice(newline + 1);
        if (!line.trim()) continue;
        let reply: Reply;
        try { reply = JSON.parse(line); }
        catch { this.rejectAll(new Error("stdio emitted non-JSON output")); return; }
        const entry = this.pending.get(reply.id!);
        if (entry) { clearTimeout(entry.timer); this.pending.delete(reply.id!); entry.resolve(reply); }
      }
    });
  }
  rejectAll(error: Error) {
    for (const entry of this.pending.values()) { clearTimeout(entry.timer); entry.reject(error); }
    this.pending.clear();
  }
  request(method: string, params: Record<string, unknown> = {}): Promise<Reply> {
    const id = ++this.nextId;
    return new Promise((resolveReply, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id); reject(new Error(`stdio timeout: ${method}`)); this.child.kill();
      }, 4000);
      this.pending.set(id, { resolve: resolveReply, reject, timer });
      this.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }
  async call(name: string, args: Record<string, unknown> = {}) {
    const reply = await this.request("tools/call", { name, arguments: args });
    expect(reply.error).toBeUndefined();
    expect(reply.result?.isError).toBe(false);
    expect(reply.result?.structuredContent).toBeDefined();
    return reply.result.structuredContent;
  }
  async close() {
    this.rejectAll(new Error("test client closed"));
    if (this.child.exitCode !== null || this.child.signalCode !== null) return;
    await new Promise<void>(resolveClosed => {
      this.child.once("exit", () => resolveClosed());
      this.child.kill();
    });
  }
}

// Retrieval times legitimately differ between calls. Original measurement dates must not.
function withoutFetchTime(value: any): any {
  if (Array.isArray(value)) return value.map(withoutFetchTime);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== "fetched_at" && key !== "attempted_at")
      .map(([key, item]) => [key, withoutFetchTime(item)]));
  }
  return value;
}

let server: Server;
let origin: string;
let body: any;
let httpStatus: number;
let client: StdioClient;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url !== "/api/gspc") { res.writeHead(404); res.end(); return; }
    res.writeHead(httpStatus, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  });
  await new Promise<void>(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture server has no TCP port");
  origin = `http://127.0.0.1:${address.port}`;
});
beforeEach(() => { body = boardFixture(); httpStatus = 200; client = new StdioClient(origin); });
afterEach(async () => { await client.close(); });
afterAll(async () => {
  await new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
});

describe("board reader transport parity", () => {
  it("advertises the canonical definitions over real stdio", async () => {
    const reply = await client.request("tools/list");
    expect(reply.error).toBeUndefined();
    expect(reply.result.tools).toEqual([...freeTools, ...paidTools]);
  });

  it.each([{}, { detail: "summary" }, { detail: "full" }])("matches HTTP board_totals for %j", async args => {
    const actual = await client.call("board_totals", args);
    expect(withoutFetchTime(actual)).toEqual(withoutFetchTime(await boardTotalsTool(origin, args)));
  });

  it("makes the default summary smaller without losing the full result", async () => {
    const summary = await client.call("board_totals");
    const full = await client.call("board_totals", { detail: "full" });
    expect(summary.detail).toBe("summary"); expect(full.detail).toBe("full");
    expect(summary.as_of.board_measured_on).toBe(body.measured_on.date);
    expect(summary.separation.ties).toBe(1); expect(summary.separation.untested).toBe(1);
    expect(full.as_of.board_measured_on).toEqual(body.measured_on);
    expect(full.count_grammar).toEqual(body.totals.count_grammar);
    expect(full.by_family).toEqual(body.totals.by_family);
    expect(JSON.stringify(summary).length).toBeLessThan(JSON.stringify(full).length / 2);
  });

  it.each(["2026-01-02", { date: "2026-01-02" }, { note: "date unknown" }, null])("matches date semantics for %j", async measuredOn => {
    body.measured_on = measuredOn;
    expect(withoutFetchTime(await client.call("board_totals")))
      .toEqual(withoutFetchTime(await boardTotalsTool(origin)));
  });

  it.each(["SEPARATED", " separated ", "TIE", "UNTESTED", null])("matches axis leader semantics for %j", async separation => {
    body.axes[0].separation = separation;
    const actual = await client.call("get_axis", { axis: "governance" });
    expect(withoutFetchTime(actual)).toEqual(withoutFetchTime(await getAxisTool(origin, { axis: "governance" })));
    if (separation !== "SEPARATED" && separation !== " separated ") {
      expect(actual.leader).toBeNull(); expect(actual.top_observed_not_separated).toBe("fixture-model");
    }
  });

  it("preserves axis provenance dates and aliases on the no-argument route", async () => {
    const explicit = await client.call("get_axis", { axis: "GOV" });
    const dedicated = await client.call("axis_governance");
    expect(explicit.resolved_from).toBe("GOV");
    expect(dedicated.facts_as_of).toBe(body.axes[0].facts_as_of);
    expect(dedicated.measurement_time).toBe(body.axes[0].measurement_time);
    expect(withoutFetchTime(dedicated)).toEqual(withoutFetchTime(await getAxisTool(origin, { axis: "governance" })));
  });

  it("keeps an unmeasured slot distinct from zero", async () => {
    body.axes[0] = { axis: "governance", status: "UNMEASURED" };
    const actual = await client.call("get_axis", { axis: "governance" });
    expect(actual.status).toBe("UNMEASURED"); expect(actual.measured).toBe(false);
    expect(actual.n).toBeNull(); expect(actual.accuracy).toBeNull(); expect(actual.leader).toBeNull();
    expect(withoutFetchTime(actual)).toEqual(withoutFetchTime(await getAxisTool(origin, { axis: "governance" })));
  });

  it("distinguishes missing arguments from a name not on the board", async () => {
    expect(await client.call("get_axis")).toEqual(await getAxisTool(origin, {}));
    const actual = await client.call("get_axis", { axis: "fixture-unknown" });
    expect(actual.state).toBe("NOT_ON_BOARD"); expect(actual.board_carries).toEqual(["governance"]);
    expect(withoutFetchTime(actual)).toEqual(withoutFetchTime(await getAxisTool(origin, { axis: "fixture-unknown" })));
  });

  it("does not reuse earlier counts after the source becomes unavailable", async () => {
    expect((await client.call("board_totals")).state).toBe("LIVE");
    httpStatus = 503;
    for (const [name, args] of [["board_totals", {}], ["get_axis", { axis: "governance" }]] as const) {
      const actual = await client.call(name, args);
      expect(actual.state).toBe("UNREACHABLE"); expect(actual.counts).toBeUndefined();
      expect(actual.accuracy).toBeUndefined();
    }
  });
});

describe("selection guidance and source copies", () => {
  it("directs overview questions to totals and single-record verification elsewhere", () => {
    expect(descriptor("board_totals").description).toContain("use get_axis");
    expect(descriptor("board_totals").description).toContain("verify_card");
    expect(descriptor("board_totals").description).toContain("UNREACHABLE");
  });
  it("distinguishes dynamic dimensions from dedicated no-argument tools", () => {
    const text = descriptor("get_axis").description;
    expect(text).toContain("selected at runtime"); expect(text).toContain("axis_*");
    expect(text).toContain("NOT_ON_BOARD"); expect(text).toContain("UNMEASURED");
  });
  it("keeps packaged definitions byte-identical to canonical definitions", () => {
    expect(readFileSync(resolve(ROOT, "mcp/gspc-server/gspc-tools.json"), "utf8"))
      .toBe(readFileSync(resolve(ROOT, "functions/mcp/gspc-tools.json"), "utf8"));
  });
});
