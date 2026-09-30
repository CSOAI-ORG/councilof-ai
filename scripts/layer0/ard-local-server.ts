/**
 * Local ARD server for the official conformance tool (ards-project/ard-spec conformance/bin/conformance-test registry).
 * Serves the SAME handlers as functions/ard/v1/* with ASSETS = public/ on disk and the real network for HF reads.
 *   node_modules/.bin/esbuild scripts/layer0/ard-local-server.ts --bundle --platform=node --format=esm --outfile=/tmp/ard-srv.mjs
 *   node /tmp/ard-srv.mjs 8797 &  ;  conformance-test registry http://127.0.0.1:8797/ard/v1
 */
import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { list, detail, search, explore } from "../../functions/_lib/ard/handlers";

const ROOT = process.env.REPO_ROOT || process.cwd();
const assets = {
  fetch: async (req: Request | string) => {
    const path = new URL(typeof req === "string" ? req : req.url).pathname;
    const f = join(ROOT, "public", decodeURIComponent(path));
    return existsSync(f) ? new Response(readFileSync(f), { status: 200 }) : new Response("<!doctype html>", { status: 200 });
  },
};

const port = Number(process.argv[2] || 8797);
http
  .createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const url = `http://127.0.0.1:${port}${req.url}`;
    const request = new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body: ["GET", "HEAD"].includes(req.method || "GET") ? undefined : Buffer.concat(chunks) });
    const ctx = { request, env: { ASSETS: assets }, params: {}, waitUntil: () => undefined };
    const p = new URL(url).pathname;
    let r: Response;
    if (p === "/ard/v1/agents") r = await list(ctx);
    else if (p.startsWith("/ard/v1/agents/")) r = await detail(ctx, decodeURIComponent(p.slice("/ard/v1/agents/".length)));
    else if (p === "/ard/v1/search") r = await search(ctx);
    else if (p === "/ard/v1/explore") r = await explore(ctx);
    else r = new Response("not found", { status: 404 });
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  })
  .listen(port, "127.0.0.1", () => console.log(`ard local server on ${port}`));
