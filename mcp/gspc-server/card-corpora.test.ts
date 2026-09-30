/**
 * The stdio server (index.mjs) reads its tool definitions from functions/mcp/gspc-tools.json, so the
 * card-corpora fixes of 2026-09-28 (public audit #3 and #4) are described there for both
 * implementations. This drives the SHIPPED index.mjs over stdio against a local origin that serves
 * public/signed/ from disk, and holds it to the same answers as the HTTP door
 * (functions/mcp/card-corpora-tools.test.ts): get_card on a signed-index id is NOT_IN_THIS_CORPUS,
 * verify_card takes a bare 64-hex id, list_cards rows carry card_url.
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PUBLIC = resolve(__dirname, "../../public");
const AUDIT_ID = "82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c";

let origin = "";
let fixture: Server;
let child: ChildProcessWithoutNullStreams;
const pending = new Map<number, (m: any) => void>();
let nextId = 1;

function rpc(method: string, params?: unknown): Promise<any> {
  const id = nextId++;
  return new Promise((done) => {
    pending.set(id, done);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }) + "\n");
  });
}
const call = async (name: string, args: Record<string, unknown>) =>
  (await rpc("tools/call", { name, arguments: args })).result as { content: { text: string }[]; structuredContent: Record<string, any> };

beforeAll(async () => {
  fixture = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://fixture.invalid");
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    };
    if (url.pathname === "/api/proof") return send(404, { error: "not_found" });
    if (url.pathname === "/api/cards") return send(200, { cards: { count: 1, signed: 1 } });
    const f = resolve(PUBLIC, "." + url.pathname);
    if (url.pathname.startsWith("/signed/") && existsSync(f) && statSync(f).isFile()) return send(200, readFileSync(f, "utf8"));
    return send(404, { error: "not_found" });
  });
  await new Promise<void>((ok) => fixture.listen(0, "127.0.0.1", ok));
  origin = `http://127.0.0.1:${(fixture.address() as AddressInfo).port}`;
  child = spawn(process.execPath, [resolve(__dirname, "index.mjs")], { env: { ...process.env, GSPC_ORIGIN: origin } });
  createInterface({ input: child.stdout }).on("line", (line) => {
    try {
      const m = JSON.parse(line);
      pending.get(m.id)?.(m);
      pending.delete(m.id);
    } catch {
      /* not a JSON-RPC line */
    }
  });
  await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "card-corpora", version: "0" } });
}, 30_000);

afterAll(async () => {
  child?.kill();
  await new Promise((ok) => fixture?.close(ok));
});

describe("stdio server: the same card-corpora answers as the HTTP door", () => {
  it("get_card on a signed-index id is NOT_IN_THIS_CORPUS with the one sentence", async () => {
    const r = await call("get_card", { sha256: AUDIT_ID });
    expect(r.structuredContent.state).toBe("NOT_IN_THIS_CORPUS");
    expect(r.structuredContent.reason).toBe("This id is in the signed card index, not the public root. Use verify_card.");
    expect(r.structuredContent.card_url).toBe(`${origin}/signed/cards/${AUDIT_ID}.json`);
  }, 30_000);

  it("verify_card takes the bare 64-hex id and answers VALID", async () => {
    const r = await call("verify_card", { card: AUDIT_ID });
    expect(r.structuredContent.state).toBe("VALID");
    expect(r.structuredContent.resolved_from).toEqual({ id: AUDIT_ID, url: `${origin}/signed/cards/${AUDIT_ID}.json` });
  }, 30_000);

  it("list_cards rows carry card_url", async () => {
    const r = await call("list_cards", { limit: 3 });
    const rows = r.structuredContent.rows as { card: string; card_url: string }[];
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.card_url).toBe(`${origin}/signed/cards/${row.card}.json`);
  }, 30_000);
});
