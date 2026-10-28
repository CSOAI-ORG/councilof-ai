/**
 * serve-mcp-local — a stand-in door for the PRE-DEPLOY probe.
 *
 * WHY. The fleet lock test compares the committed probe (evidence/mcp-registry.json) with the
 * lock, and a live probe of a branch that adds tools sees the OLD fleet — the branch is not
 * live until it deploys. scripts/mcp-probe.mjs --door-origin exists for exactly this window:
 * every https://councilof.ai/* target is answered by this origin instead, and the artefact
 * says so on every server it touches (contacted + stand_in_for + probe_scope).
 *
 * WHAT IT SERVES. The in-process handler from functions/mcp/[[path]].ts — the same code the
 * Pages Function runs — so the probe sees THIS branch's tools/list, not a hand-written list.
 * The request URL is rewritten to https://councilof.ai so the upstream API calls inside the
 * handler still reach the real live API; only the door itself is the stand-in.
 *
 * It is a local, single-purpose tool for one probe window. It binds to 127.0.0.1 only.
 *
 *   npx tsx scripts/serve_mcp_local.mts [--port 8799]
 */
import { createServer } from "node:http";
import { onRequest } from "../functions/mcp/[[path]].ts";

const PORT = Number(
  (process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ??
    process.argv[process.argv.indexOf("--port") + 1] ??
    8799),
);
const DOOR_URL = "https://councilof.ai";

const server = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = Buffer.concat(chunks);
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  // The door answers on the real origin; only the socket is local.
  const rewritten = new URL(url.pathname + url.search, DOOR_URL);
  const request = new Request(rewritten, {
    method: req.method,
    headers: Object.entries(req.headers).flatMap(([k, v]) =>
      v === undefined ? [] : [[k, Array.isArray(v) ? v.join(", ") : String(v)]],
    ),
    body: body.length ? body : undefined,
  });
  const response = await onRequest({
    request,
    env: {},
    waitUntil: () => {},
  } as never);
  const headers: Record<string, string> = {};
  response.headers.forEach((v, k) => {
    headers[k] = v;
  });
  const text = await response.text();
  res.writeHead(response.status, headers);
  res.end(text);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`serve-mcp-local: standing in for ${DOOR_URL} on http://127.0.0.1:${PORT}`);
});
