/**
 * GET /api/ras/mcp-probe?url=<https MCP endpoint> — ONE live, read-only MCP discovery of a public
 * endpoint, returned with an Ed25519-signed receipt.
 *
 * What it sends, in order, and nothing else:
 *   1. `server/discover` in the 2026-07-28 shape (MCP-Protocol-Version + Mcp-Method headers,
 *      params._meta carrying the protocol version and empty client capabilities) — the request
 *      shape functions/mcp/mcp-protocol.test.ts pins for our own mount.
 *   2. only if (1) did not answer with a JSON-RPC result: legacy `initialize` (protocolVersion
 *      2025-06-18, as scripts/probes/mcp_liveness_sample.py sends), then the
 *      `notifications/initialized` notification the lifecycle requires before a list.
 *   3. `tools/list`, following nextCursor for at most 5 pages.
 * It NEVER sends tools/call, prompts/get, resources/read or anything that runs server code on the
 * caller's behalf. Every request goes through functions/api/_ras_net.ts (https only, public
 * addresses only, redirects re-checked, 10 s per request, 1 MiB per response).
 *
 * States (the liveness sampler's vocabulary, extended where the modern handshake needs it):
 *   RESPONDED       a JSON-RPC result to server/discover or initialize
 *   AUTH_REQUIRED   HTTP 401/403 — the endpoint answers but wants credentials
 *   NOT_MCP         answered over HTTP, but not as JSON-RPC (HTML, 404, 405, non-JSON …)
 *   MCP_ERROR       answered as JSON-RPC, but only with errors — no handshake result
 *   UNREACHABLE     DNS / connect / TLS failure, or HTTP 5xx without a JSON-RPC body
 *   TIMEOUT         no complete answer within 10 s
 * Every one of these is a DELIVERED result: the probe ran. A URL refused by the SSRF guard, or a
 * host whose DNS could not be read, is not probed and not settled.
 *
 * A probe is not a grade and not a measurement on the board. RESPONDED says the endpoint answered
 * a discovery handshake at fetched_at; it says nothing about what its tools do.
 */
import { headFromGet } from "../_head";
import { x402Accepts, declareBazaarHttpGet } from "../_x402";
import { rasDoor, nowIso, sha256Text, type RasEnv, type RasComputation } from "../_ras_door";
import { checkUrl, checkUrlSyntax, guardedFetch, memoResolver, type Resolver, dohResolver } from "../_ras_net";
import { RAS_MCP_PROBE_DESCRIPTION } from "../_x402_descriptions";

export const SCHEMA = "csoai.ras.mcp-probe/0.1";
export const KIND = "csoai.ras.mcp-probe/0.1";
export const ATTESTS = "one read-only MCP discovery of the named endpoint at fetched_at — a probe, not a grade; no tool was called";
export const MODERN_VERSION = "2026-07-28";
export const LEGACY_VERSION = "2025-06-18";
export const TIMEOUT_MS = 10_000;
export const MAX_BYTES = 1024 * 1024;
export const MAX_TOOL_PAGES = 5;
const UA = "csoai-ras-mcp-probe/0.1 (+https://councilof.ai; one read-only discovery; never calls a tool)";
const CLIENT_INFO = { name: "csoai-ras-mcp-probe", version: "0.1" };

export type McpState = "RESPONDED" | "AUTH_REQUIRED" | "NOT_MCP" | "MCP_ERROR" | "UNREACHABLE" | "TIMEOUT";

type Step =
  | { kind: "RESULT"; status: number; result: Record<string, unknown>; headers: Headers }
  | { kind: "RPC_ERROR"; status: number; error: { code?: number; message?: string } }
  | { kind: "HTTP"; status: number; content_type: string }
  | { kind: "NOT_JSONRPC"; status: number; content_type: string }
  | { kind: "TIMEOUT"; detail: string }
  | { kind: "UNREACHABLE"; detail: string }
  | { kind: "BLOCKED"; reason: string; detail: string };

/** Parse a JSON or SSE-framed JSON-RPC answer; the message whose id matches wins. */
export function parseJsonRpc(body: string, contentType: string, id: string | number): Record<string, unknown> | null {
  const isEnv = (o: unknown): o is Record<string, unknown> => !!o && typeof o === "object" && (o as Record<string, unknown>).jsonrpc === "2.0" && ("result" in (o as object) || "error" in (o as object));
  if (contentType.includes("text/event-stream") || /^\s*(event|data):/m.test(body.slice(0, 200))) {
    const msgs: Record<string, unknown>[] = [];
    for (const ev of body.replace(/\r\n/g, "\n").split(/\n\n/)) {
      const data = ev.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).replace(/^ /, "")).join("\n");
      if (!data || data === "[DONE]") continue;
      try { const p = JSON.parse(data); if (isEnv(p)) msgs.push(p); } catch { /* skip non-JSON event */ }
    }
    return msgs.find((m) => m.id === id) ?? msgs.at(-1) ?? null;
  }
  try {
    const p = JSON.parse(body);
    if (Array.isArray(p)) return (p.find((m) => isEnv(m) && m.id === id) as Record<string, unknown>) ?? null;
    return isEnv(p) ? p : null;
  } catch {
    return null;
  }
}

async function send(url: string, method: string, params: Record<string, unknown>, opts: { modern: boolean; version: string; id?: string | number; session?: string | null; resolver: Resolver }): Promise<Step> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "user-agent": UA,
    "MCP-Protocol-Version": opts.version,
  };
  if (opts.modern) headers["Mcp-Method"] = method;
  if (opts.session) headers["Mcp-Session-Id"] = opts.session;
  const body: Record<string, unknown> = { jsonrpc: "2.0", method, params };
  if (opts.id !== undefined) body.id = opts.id;
  const out = await guardedFetch(url, { method: "POST", headers, body: JSON.stringify(body), timeoutMs: TIMEOUT_MS, maxBytes: MAX_BYTES, maxRedirects: 3, resolver: opts.resolver });
  if (out.kind === "BLOCKED") return { kind: "BLOCKED", reason: out.reason, detail: out.detail };
  if (out.kind === "TIMEOUT") return { kind: "TIMEOUT", detail: out.detail };
  if (out.kind === "UNREACHABLE") return { kind: "UNREACHABLE", detail: out.detail };
  const ct = out.headers.get("content-type") || "";
  if (opts.id === undefined) return { kind: "HTTP", status: out.status, content_type: ct }; // a notification: any answer is fine
  // 401/403 first: an auth wall that answers with a JSON-RPC error body is still an auth wall.
  if (out.status === 401 || out.status === 403) return { kind: "HTTP", status: out.status, content_type: ct };
  const msg = parseJsonRpc(new TextDecoder().decode(out.body), ct, opts.id);
  if (msg && msg.result && typeof msg.result === "object") return { kind: "RESULT", status: out.status, result: msg.result as Record<string, unknown>, headers: out.headers };
  if (msg && msg.error) return { kind: "RPC_ERROR", status: out.status, error: msg.error as { code?: number; message?: string } };
  if (out.status >= 500) return { kind: "HTTP", status: out.status, content_type: ct };
  return { kind: "NOT_JSONRPC", status: out.status, content_type: ct };
}

const stepSummary = (method: string, s: Step) => ({
  method,
  outcome: s.kind,
  http_status: "status" in s ? s.status : null,
  ...(s.kind === "RPC_ERROR" ? { rpc_error_code: s.error?.code ?? null } : {}),
  ...(s.kind === "TIMEOUT" || s.kind === "UNREACHABLE" || s.kind === "BLOCKED" ? { detail: s.detail.slice(0, 160) } : {}),
});

/** Decide the state from the handshake steps. Exported so the rule is tested without a network. */
export function classify(discover: Step, init: Step | null): McpState {
  const last = init ?? discover;
  if (discover.kind === "RESULT" || init?.kind === "RESULT") return "RESPONDED";
  for (const s of [discover, init]) if (s && s.kind === "HTTP" && (s.status === 401 || s.status === 403)) return "AUTH_REQUIRED";
  if (last.kind === "TIMEOUT") return "TIMEOUT";
  if (last.kind === "UNREACHABLE") return "UNREACHABLE";
  if (discover.kind === "RPC_ERROR" || init?.kind === "RPC_ERROR") return "MCP_ERROR";
  if (last.kind === "HTTP" && last.status >= 500) return "UNREACHABLE";
  return "NOT_MCP";
}

/** The probe itself. Exported for the live test; the door wraps it. */
export async function probeMcp(target: string, baseResolver: Resolver = dohResolver): Promise<RasComputation> {
  const resolver = memoResolver(baseResolver);
  const fetched_at = nowIso();
  const t0 = Date.now();
  // Refuse before any request if the host is not provably public. Not settled.
  const pre = await checkUrl(target, resolver);
  if (pre.ok === false) {
    const status = pre.reason === "DNS_CHECK_UNAVAILABLE" ? 503 : 400;
    return { delivered: false, status, error: pre.reason === "DNS_CHECK_UNAVAILABLE" ? "dns_check_unavailable" : "url_refused", reason: `${pre.reason}: ${pre.detail}` };
  }
  const steps: ReturnType<typeof stepSummary>[] = [];
  const modernMeta = { "io.modelcontextprotocol/protocolVersion": MODERN_VERSION, "io.modelcontextprotocol/clientCapabilities": {} };
  const discover = await send(target, "server/discover", { _meta: modernMeta }, { modern: true, version: MODERN_VERSION, id: 1, resolver });
  steps.push(stepSummary("server/discover", discover));
  if (discover.kind === "BLOCKED") return { delivered: false, status: 400, error: "url_refused", reason: `${discover.reason}: ${discover.detail}` };

  let init: Step | null = null;
  let era: "modern" | "legacy" | null = null;
  let negotiated: string | null = null;
  let serverInfo: unknown = null;
  let session: string | null = null;
  const requested = [MODERN_VERSION];
  if (discover.kind === "RESULT") {
    era = "modern";
    const sv = discover.result.supportedVersions;
    negotiated = Array.isArray(sv) && sv.includes(MODERN_VERSION) ? MODERN_VERSION : typeof discover.result.protocolVersion === "string" ? (discover.result.protocolVersion as string) : null;
    serverInfo = discover.result.serverInfo ?? null;
  } else if (discover.kind !== "TIMEOUT" && discover.kind !== "UNREACHABLE" && !(discover.kind === "HTTP" && (discover.status === 401 || discover.status === 403))) {
    requested.push(LEGACY_VERSION);
    init = await send(target, "initialize", { protocolVersion: LEGACY_VERSION, capabilities: {}, clientInfo: CLIENT_INFO }, { modern: false, version: LEGACY_VERSION, id: 2, resolver });
    steps.push(stepSummary("initialize", init));
    if (init.kind === "BLOCKED") return { delivered: false, status: 400, error: "url_refused", reason: `${init.reason}: ${init.detail}` };
    if (init.kind === "RESULT") {
      era = "legacy";
      negotiated = typeof init.result.protocolVersion === "string" ? (init.result.protocolVersion as string) : null;
      serverInfo = init.result.serverInfo ?? null;
      session = init.headers.get("mcp-session-id");
      const note = await send(target, "notifications/initialized", {}, { modern: false, version: negotiated || LEGACY_VERSION, session, resolver });
      steps.push(stepSummary("notifications/initialized", note));
    }
  }
  const state = classify(discover, init);

  // tools/list — read-only; names are hashed, never executed.
  const names: string[] = [];
  let toolsState: "LISTED" | "LIST_ERROR" | "NOT_ATTEMPTED" | "PARTIAL" = "NOT_ATTEMPTED";
  let pages = 0;
  if (state === "RESPONDED") {
    let cursor: string | undefined;
    toolsState = "LISTED";
    for (;;) {
      const params: Record<string, unknown> = cursor ? { cursor } : {};
      if (era === "modern") params._meta = modernMeta;
      const tl = await send(target, "tools/list", params, { modern: era === "modern", version: negotiated || (era === "modern" ? MODERN_VERSION : LEGACY_VERSION), id: 10 + pages, session, resolver });
      steps.push(stepSummary("tools/list", tl));
      pages++;
      if (tl.kind !== "RESULT" || !Array.isArray(tl.result.tools)) { toolsState = pages === 1 ? "LIST_ERROR" : "PARTIAL"; break; }
      for (const t of tl.result.tools as { name?: unknown }[]) if (t && typeof t.name === "string") names.push(t.name);
      const next = tl.result.nextCursor;
      if (typeof next !== "string" || !next) break;
      if (pages >= MAX_TOOL_PAGES) { toolsState = "PARTIAL"; break; }
      cursor = next;
    }
  }
  const sorted = [...new Set(names)].sort();
  const lastHttp = [...steps].reverse().find((s) => s.http_status !== null)?.http_status ?? null;
  const payload: Record<string, unknown> = {
    kind: KIND,
    attests: ATTESTS,
    target: { url: target, host: pre.url.hostname },
    state,
    protocol: { requested, negotiated, era },
    handshake_http_status: lastHttp,
    tools: {
      state: toolsState,
      count: toolsState === "LISTED" || toolsState === "PARTIAL" ? sorted.length : null,
      names_sha256: toolsState === "LISTED" || toolsState === "PARTIAL" ? await sha256Text(JSON.stringify(sorted)) : null,
      names_sha256_rule: "sha256 of the UTF-8 JSON array of distinct tool names, sorted, compact (JSON.stringify)",
      pages,
      complete: toolsState === "LISTED",
    },
    server_info_sha256: serverInfo ? await sha256Text(JSON.stringify(serverInfo)) : null,
    tool_called: false,
    methods_sent: steps.map((s) => s.method),
    elapsed_ms: Date.now() - t0,
    fetched_at,
    rule: "server/discover (2026-07-28) first; initialize (2025-06-18) + notifications/initialized only if discover gave no result; tools/list ≤ 5 pages; never tools/call",
  };
  return {
    delivered: true,
    payload,
    subject: `MCP discovery of ${pre.url.hostname} — ${state}`,
    source_urls: [target],
    evidence: { steps, tool_names: sorted, server_info: serverInfo },
    unmeasured: ["tool behaviour (never called)", ...(toolsState === "PARTIAL" ? ["tools beyond the pages read"] : [])],
  };
}

export const onRequestGet: PagesFunction<RasEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const target = (url.searchParams.get("url") || "").trim();
  const resourceUrl = `${origin}/api/ras/mcp-probe`;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "ras_fresh_read", tier: "per_read", description: RAS_MCP_PROBE_DESCRIPTION, productId: "csoai.product.ras.mcp_probe" });
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    queryParams: { url: target || "https://councilof.ai/mcp" },
    queryParamsSchema: { properties: { url: { type: "string", format: "uri", pattern: "^https://", description: "public https MCP endpoint (Streamable HTTP); private, link-local and metadata addresses are refused" } }, required: ["url"] },
    outputExample: { schema: SCHEMA, kind: "receipt", result: { kind: KIND, state: "RESPONDED | AUTH_REQUIRED | NOT_MCP | MCP_ERROR | UNREACHABLE | TIMEOUT", protocol: { requested: [MODERN_VERSION], negotiated: "<version or null>" }, tools: { count: "<int or null>", names_sha256: "<hex or null>" }, tool_called: false }, receipt: { sha256: "<hex>", sig_ed25519: "<hex or null>" } },
  });
  return rasDoor({
    request, env, schema: SCHEMA, surface: "ras.mcp-probe", resourceUrl,
    freePreviewPath: "/evidence/mcp-remote-census/",
    description: RAS_MCP_PROBE_DESCRIPTION,
    serviceName: "CSOAI MCP Probe",
    tags: ["mcp", "probe", "discovery", "receipt", "x402"],
    accepts, bazaar,
    deliverable: "one signed card-v0 receipt over a live read-only MCP discovery: state, requested vs negotiated protocol version, tool count and tool-names sha256 (names returned beside it)",
    never: ["a tool call", "a grade", "a rank", "a safety judgement", "a certificate", "a board cell"],
    inputError: () => {
      if (!target) return { status: 400, error: "bad_request", reason: "pass url=<https MCP endpoint>" };
      const s = checkUrlSyntax(target);
      return s.ok === true ? null : { status: 400, error: "url_refused", reason: `${s.reason}: ${s.detail}` };
    },
    compute: () => probeMcp(target),
    counter: "count:ras_mcp_probes",
  });
};

export const onRequestPost = onRequestGet;

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);
