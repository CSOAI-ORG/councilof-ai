// SPDX-License-Identifier: Apache-2.0
/**
 * Every read the panel makes. One origin (councilof.ai, or a councilof-ai Pages preview), GET or
 * the MCP JSON-RPC POST, nothing else. `fetchFn` is injectable so tests replay recorded bytes.
 */
import { ORIGIN, allowedOrigin } from "./constants.js";

export class SourceError extends Error {
  constructor(url, detail) {
    super(`${url}: ${detail}`);
    this.url = url;
  }
}

export function makeSources({ origin = ORIGIN, fetchFn = globalThis.fetch?.bind(globalThis) } = {}) {
  if (!allowedOrigin(origin)) throw new Error(`gspc-panel reads councilof.ai only; refused origin ${origin}`);
  if (typeof fetchFn !== "function") throw new Error("gspc-panel needs fetch");
  const cache = new Map();

  async function getText(path) {
    const url = origin + path;
    let r;
    try {
      r = await fetchFn(url, { headers: { accept: "application/json, application/x-ndjson" }, credentials: "omit" });
    } catch (e) {
      throw new SourceError(url, e?.message || "network error");
    }
    if (!r.ok) throw new SourceError(url, `HTTP ${r.status}`);
    return r.text();
  }

  function getJson(path) {
    if (!cache.has(path)) cache.set(path, getText(path).then((t) => JSON.parse(t)));
    return cache.get(path);
  }

  /** One free MCP tool call on /mcp/free. Returns structuredContent (or throws). */
  async function tool(name, args) {
    const url = origin + "/mcp/free";
    let r;
    try {
      r = await fetchFn(url, {
        method: "POST",
        credentials: "omit",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
      });
    } catch (e) {
      throw new SourceError(url, e?.message || "network error");
    }
    if (!r.ok) throw new SourceError(url, `HTTP ${r.status}`);
    const msg = parseJsonRpcBody(await r.text());
    if (msg?.error) throw new SourceError(url, `${name}: ${msg.error.message ?? "error"}`);
    const sc = msg?.result?.structuredContent;
    if (!sc || typeof sc !== "object") throw new SourceError(url, `${name}: no structuredContent`);
    return sc;
  }

  return {
    origin,
    tool,
    getJson,
    getText,
    gspc: () => getJson("/api/gspc"),
    corrections: () => getJson("/api/corrections"),
    claimsRegister: () => getJson("/api/claims/register"),
    state: () => getJson("/api/state"),
    modelsMeasured: () => getJson("/interop/models-measured.json"),
    card: (id) => getJson(`/signed/cards/${id}.json`),
  };
}

/** A JSON-RPC response as plain JSON or as an SSE stream (the last data: line wins). */
export function parseJsonRpcBody(text) {
  const t = String(text ?? "").trim();
  if (t.startsWith("{")) return JSON.parse(t);
  const datas = t.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
  if (!datas.length) throw new Error("empty MCP response");
  return JSON.parse(datas[datas.length - 1]);
}
