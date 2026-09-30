#!/usr/bin/env node
// GSPC Route pod service (decide-only). Node stdlib + the bundled edge core (dist/route-core.mjs).
//
//   POST /route           route args as for the MCP tool `route`. With no `candidates`, the candidates are the
//                         models the LOCAL Ollama serves (GET $OLLAMA_URL/api/tags), each a caller-owned
//                         local_gpu candidate. Returns the route result; appends the record to $RECORDS_FILE.
//   POST /authz           agentgateway extAuthz hook for execution paths: always refuses with 501 NOT_ENABLED.
//   *    /v1/*, /route_execute   501 NOT_ENABLED (execution, caller-key passthrough and x402 amounts are owner decisions).
//   GET  /healthz
//
// Binds 127.0.0.1 only. No prompt or response bytes are stored: the task is hashed by the core.
import http from "node:http";
import fs from "node:fs";
import { route, routeSummary, NOT_ENABLED, ardListingSource, ARD_LISTINGS } from "./dist/route-core.mjs";

const PORT = Number(process.env.ROUTE_PORT || 8790);
const OLLAMA = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const BOARD_URL = process.env.BOARD_URL || "https://councilof.ai/api/gspc";
const BOARD_FILE = process.env.BOARD_FILE || "";
const CENSUS_URL = process.env.CENSUS_URL || "https://councilof.ai/interop/effect-binding-census-index.json";
const CENSUS_FILE = process.env.CENSUS_FILE || "";
const RECORDS = process.env.RECORDS_FILE || "";
const MAX_BODY = 256 * 1024;

async function fetchBoard() {
  if (BOARD_FILE) return JSON.parse(fs.readFileSync(BOARD_FILE, "utf8"));
  const r = await fetch(BOARD_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** The signed effect-binding census index the floor reads (functions/_lib/route/census.ts). */
async function fetchCensus() {
  if (CENSUS_FILE) return JSON.parse(fs.readFileSync(CENSUS_FILE, "utf8"));
  const r = await fetch(CENSUS_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** ARD listings as a discovery source (functions/_lib/route/discovery.ts). DISCOVERY_OFF=1 disables it. */
async function fetchListing(url) {
  const r = await fetch(url, { headers: { accept: "application/json", "user-agent": "councilof.ai gspc-route (+https://councilof.ai/ard/)" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export const discovery = process.env.DISCOVERY_OFF === "1" ? undefined
  : Object.fromEntries(Object.entries(ARD_LISTINGS).map(([k, u]) => [k, ardListingSource(u, fetchListing)]));

/** Local Ollama models as caller-owned candidates. Cost is the caller's own GPU: declared 0. */
export async function ollamaCandidates() {
  const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`ollama /api/tags HTTP ${r.status}`);
  const tags = (await r.json()).models ?? [];
  return tags
    .map((m) => String(m.name || m.model))
    .filter((n) => /^[A-Za-z0-9._:/@+-]{1,100}$/.test(n))
    .sort()
    .map((name) => ({
      id: `local:${name.replace(/:latest$/, "")}`,
      kind: "local_gpu",
      provider: "ollama",
      model: name.replace(/:latest$/, ""),
      endpoint: `local:ollama/${name}`,
      read_only: true,
      cost_declared: 0,
    }));
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const parts = [];
    req.on("data", (c) => {
      n += c.length;
      if (n > MAX_BODY) { reject(new Error("body too large")); req.destroy(); }
      else parts.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(parts).toString("utf8")));
    req.on("error", reject);
  });
}

export const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  try {
    if (path === "/healthz") return send(res, 200, { state: "OK", mode: "decide_only" });
    if (path === "/authz" || path.startsWith("/v1/") || path === "/route_execute") return send(res, 501, NOT_ENABLED);
    if (path !== "/route" || req.method !== "POST") return send(res, 404, { state: "NOT_FOUND" });
    let args;
    try {
      args = JSON.parse((await readBody(req)) || "{}");
    } catch (e) {
      return send(res, 400, { state: "BAD_ARGUMENTS", errors: [String(e.message || e)] });
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) return send(res, 400, { state: "BAD_ARGUMENTS", errors: ["body must be an object"] });
    let candidate_source = "caller_declared";
    if (args.candidates === undefined) {
      try {
        args.candidates = await ollamaCandidates();
        candidate_source = "local_ollama";
      } catch (e) {
        return send(res, 503, { state: "UNREACHABLE", source: `${OLLAMA}/api/tags`, error: String(e.message || e) });
      }
    }
    const out = await route(args, { fetchBoard, fetchCensus, discovery });
    if (out.state === "NOT_ENABLED") return send(res, 501, out);
    if (out.state === "BAD_ARGUMENTS") return send(res, 400, out);
    if (RECORDS && out.record) fs.appendFileSync(RECORDS, JSON.stringify(out.record) + "\n");
    return send(res, 200, { ...out, candidate_source, summary: routeSummary(out) });
  } catch (e) {
    return send(res, 500, { state: "ERROR", error: String(e && e.message ? e.message : e) });
  }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, "127.0.0.1", () => console.log(`gspc-route service on 127.0.0.1:${PORT} (decide-only)`));
}
