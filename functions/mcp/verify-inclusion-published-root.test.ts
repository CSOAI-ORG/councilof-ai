/**
 * verify_inclusion answers against the merkle_root published in /root.json (17 Nov 2026).
 *
 * Before this, the tool said VALID whenever GET /api/proof answered kind:"inclusion"; it never walked
 * the path. On 17 Nov /proofs/* redirected to a Hugging Face mirror that still held the previous root's
 * paths: 59 of 76 sampled leaves answered VALID against e9da6874..., a root nothing publishes, while
 * /root.json published 510cbc2f..., and the Academy inclusion exercise failed for every learner.
 *
 * The network is a loopback origin serving the committed public/ bytes. /api/proof is the real Function
 * (functions/api/proof.ts) unless a test serves the body a stale mirror would. The HTTP tool and the
 * shipped stdio server (mcp/gspc-server/index.mjs) are held to the same answers.
 */
import { createHash } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { rootFromLeaves, rootFromPath, verifyInclusionTool } from "./_board";
import { sharedToolResult } from "./_handlers";
import { onRequestGet as proofGet } from "../api/proof";

const REPO = resolve(__dirname, "../..");
const PUBLIC = resolve(REPO, "public");
const ROOT = JSON.parse(readFileSync(resolve(PUBLIC, "root.json"), "utf8")) as { card_sha256: string[]; card_count: number; merkle_root: string };
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const MID = Math.floor(ROOT.card_count / 2);
const LEAF = ROOT.card_sha256[MID];
const LAST = ROOT.card_sha256[ROOT.card_count - 1];
const NOBODY = sha256("a digest in no corpus, 2026-11-17");
const storedProof = (sha: string) =>
  JSON.parse(readFileSync(resolve(PUBLIC, "proofs", `${sha.slice(0, 16)}.json`), "utf8")) as { index: number; proof: string[] };

/** What the stale mirror served: the same index, a different top sibling, and the root that path reaches. */
async function staleBody(sha: string) {
  const s = storedProof(LEAF);
  const proof = [...s.proof.slice(0, -1), sha256("the previous root's top sibling")];
  return { schema: "csoai.public-root-proof/0.1", kind: "inclusion", free: true, sha256: sha, index: s.index, proof, merkle_root: await rootFromPath(sha, s.index, proof), card_count: ROOT.card_count };
}

type Mode = "real" | "stale" | "past-bound" | "root-503";
let mode: Mode = "real";
let origin = "";
let server: Server;
let child: ChildProcessWithoutNullStreams;
const pending = new Map<number, (m: any) => void>();
let nextId = 1;

function stdio(method: string, params?: unknown): Promise<any> {
  const id = nextId++;
  return new Promise((done) => {
    pending.set(id, done);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }) + "\n");
  });
}

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", origin);
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    };
    if (url.pathname === "/root.json" && mode === "root-503") return send(503, { error: "unavailable" });
    if (url.pathname === "/api/proof") {
      const sha = url.searchParams.get("sha") ?? "";
      if (mode === "stale") return send(200, await staleBody(sha));
      if (mode === "past-bound") return send(200, { kind: "inclusion", sha256: sha, index: ROOT.card_count, proof: storedProof(LAST).proof, merkle_root: ROOT.merkle_root });
      if (mode === "root-503") return send(200, { kind: "inclusion", sha256: sha, ...storedProof(sha), merkle_root: ROOT.merkle_root });
      const r = await (proofGet as unknown as (c: unknown) => Promise<Response>)({ request: new Request(url.toString()), env: {} });
      return send(r.status, await r.text());
    }
    const f = resolve(PUBLIC, "." + url.pathname);
    if (existsSync(f) && statSync(f).isFile()) return send(200, readFileSync(f, "utf8"));
    return send(404, { error: "not_found" });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  child = spawn(process.execPath, [resolve(REPO, "mcp/gspc-server/index.mjs")], { cwd: REPO, env: { ...process.env, GSPC_ORIGIN: origin }, stdio: ["pipe", "pipe", "pipe"] });
  child.stderr.resume();
  createInterface({ input: child.stdout }).on("line", (line) => {
    if (!line.trim()) return;
    const m = JSON.parse(line);
    pending.get(m.id)?.(m);
    pending.delete(m.id);
  });
  await stdio("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "verify-inclusion-test", version: "0" } });
}, 30_000);

afterAll(async () => {
  child?.kill();
  await new Promise<void>((r) => server.close(() => r()));
});
beforeEach(() => {
  mode = "real";
});

const KEYS = ["state", "sha256", "merkle_root", "card_count", "index", "checked", "reason", "served_proof"] as const;
const project = (r: Record<string, unknown>) => Object.fromEntries(KEYS.map((k) => [k, r[k]]));

/** One call through each transport: the HTTP payload and summary line, and the stdio payload and summary line. */
async function both(sha: string) {
  const http = (await verifyInclusionTool(origin, { sha256: sha })) as Record<string, any>;
  const line = (await sharedToolResult("verify_inclusion", { sha256: sha }, origin)).content[0].text.split("\n")[0];
  const s = await stdio("tools/call", { name: "verify_inclusion", arguments: { sha256: sha } });
  const stdioPayload = s.result.structuredContent as Record<string, any>;
  const stdioLine = String(s.result.content[0].text).split("\n")[0];
  expect(project(stdioPayload)).toEqual(project(http));
  return { http, line, stdioLine };
}

describe("the committed bytes agree with themselves", () => {
  it("the leaf list rebuilds the published root, and a committed path walks to it", async () => {
    expect(ROOT.card_sha256.length).toBe(ROOT.card_count);
    expect(await rootFromLeaves(ROOT.card_sha256)).toBe(ROOT.merkle_root);
    const s = storedProof(LEAF);
    expect(s.index).toBe(MID);
    expect(await rootFromPath(LEAF, s.index, s.proof)).toBe(ROOT.merkle_root);
  });
});

describe("verify_inclusion checks the path against /root.json, never the proof endpoint's own word", () => {
  it("a current proof: VALID because its path recomputes to the published root", async () => {
    const { http, line, stdioLine } = await both(LEAF);
    expect(http).toMatchObject({ state: "VALID", merkle_root: ROOT.merkle_root, index: MID, card_count: ROOT.card_count });
    expect(http.checked).toMatch(/served path recomputes/);
    expect(http.served_proof).toBeUndefined();
    expect(line).toBe(`VALID — the path recomputes to the published root ${ROOT.merkle_root.slice(0, 16)} (leaf ${MID} of ${ROOT.card_count}).`);
    expect(stdioLine).toBe(line);
  });

  it("a stale mirror's path is set aside: the answer names the published root, not the one the path reaches", async () => {
    mode = "stale";
    const { http, line, stdioLine } = await both(LEAF);
    expect(http).toMatchObject({ state: "VALID", merkle_root: ROOT.merkle_root, index: MID });
    expect(http.checked).toMatch(/leaf list in \/root\.json/);
    expect(http.served_proof).toMatchObject({ index: MID, reaches_published_root: false, index_below_card_count: true });
    expect(http.served_proof.merkle_root).not.toBe(ROOT.merkle_root);
    expect(line).toContain("recomputed from the leaf list in /root.json");
    expect(stdioLine).toBe(line);
  });

  it("a stale path for a digest outside the published list is INVALID, whatever root the path reaches", async () => {
    mode = "stale";
    const { http } = await both(NOBODY);
    expect(http).toMatchObject({ state: "INVALID", merkle_root: ROOT.merkle_root, reason: "not in the leaf list of /root.json" });
    expect(http.served_proof.reaches_published_root).toBe(false);
    expect(http.corpus_note).toEqual(expect.any(String));
  });

  it("an index at or past card_count proves nothing, even when its path recomputes", async () => {
    mode = "past-bound";
    const { http } = await both(LAST);
    expect(http).toMatchObject({ state: "VALID", merkle_root: ROOT.merkle_root, index: ROOT.card_count - 1 });
    expect(http.served_proof).toMatchObject({ index: ROOT.card_count, index_below_card_count: false });
    // With an odd card_count the duplicated tail is at the leaf level, so the forged index really does
    // recompute to the published root: exactly the CVE-2012-2459 shape the bound exists for.
    if (ROOT.card_count % 2 === 1) expect(http.served_proof.reaches_published_root).toBe(true);
  });

  it("an unreadable /root.json is UNCHECKABLE, never VALID", async () => {
    mode = "root-503";
    const { http, line } = await both(LEAF);
    expect(http.state).toBe("UNCHECKABLE");
    expect(http.reason).toMatch(/\/root\.json could not be read/);
    expect(line).toMatch(/^UNCHECKABLE — the proof endpoint answered/);
  });
});
