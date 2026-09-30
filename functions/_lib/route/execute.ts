/**
 * GSPC Route: execution (POST /api/route/execute). Owner ruling 2026-09-30, phases 1-4:
 *
 *  1. READ-ONLY, FREE, SERVER-SIDE. The edge calls the chosen MCP tool itself only when the tool is
 *     VERIFIED read-only: a first-party tool annotated readOnlyHint, or a third-party tool the signed
 *     effect-binding probe listed in that server's read_only_tools (census.ts, per-tool rows). The floor still
 *     refuses a tool whose probe observed DIVERGENT (extra argument silently accepted) unless the caller's policy
 *     sets allow_divergent_effect_binding. The edge sends no credential of any kind.
 *  2. CALLER CREDENTIALS ARE CLIENT-SIDE ONLY. A request that carries anything shaped like a credential is
 *     refused before any rule runs (CREDENTIALS_REFUSED), and the value is neither echoed, logged nor stored.
 *     A target the edge may not call (auth needed, local, not verified read-only) is answered CLIENT_SIDE with
 *     the exact JSON-RPC request for the caller to send from their own machine, with their own key.
 *  3. PAID via x402 at the door's own amount. The edge first calls WITHOUT payment and must observe a 402
 *     challenge; it forwards the caller's x_payment only when the caller confirms THAT challenge by its
 *     sha256 (payment.challenge_sha256). No challenge => nothing is paid. The edge holds no wallet.
 *  4. ACTIONS. A first-party tool that is not read-only runs only with confirm_action: true. A third-party tool
 *     that is not verified read-only is never called by the edge: CLIENT_SIDE with per_call_confirm.
 *
 * Every outcome with a signer is returned as a receipt (csoai.route-evidence/0.1) signed under
 * did:web:csoai.org#route-attestation-1. No signer => nothing is executed (fail closed). Arguments and the
 * target's answer are carried in the receipt as sha256 only; the answer itself goes to the caller and is not
 * stored. Nothing in this file writes to a log.
 */
import { routeCore, type RouteDeps, type RouteResult } from "./route";
import { jcs, sha256Hex, ROUTE_LIMITS, censusLimit } from "./evidence";
import { signRecord, type Signer } from "./sign";
import type { Candidate } from "./types";

export const EXECUTE_VERSION = "0.1.0";
export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const MAX_BODY_BYTES = 32_768;
export const MAX_ARGS_BYTES = 8_192;
export const MAX_RESPONSE_BYTES = 524_288;
export const TARGET_TIMEOUT_MS = 15_000;

export type ExecuteDeps = RouteDeps & {
  /** Outbound fetch to the target. Injected: tests assert what it is (never) given. */
  fetchTarget: (url: string, init: RequestInit) => Promise<Response>;
  signer: Signer | { unavailable: string };
  /** This deployment's origin: first-party tools are called here (so a preview calls itself, not prod). */
  origin: string;
};

export type ExecuteResult = { http_status: number; body: Record<string, unknown> };

/* ---------------------------------------------------------------- credentials (phase 2) */

/** Key names that carry a credential. Matched on every key at every depth of the request. */
export const CREDENTIAL_KEY =
  /^(authorization|proxy[-_]?authorization|cookie|set[-_]?cookie|headers?|x[-_]?api[-_]?key|api[-_]?key|apikey|api[-_]?token|access[-_]?token|refresh[-_]?token|id[-_]?token|auth[-_]?token|bearer|secret|client[-_]?secret|password|passwd|private[-_]?key|session[-_]?token|credentials?)$/i;
/** String values shaped like a credential, wherever they appear. */
export const CREDENTIAL_VALUE =
  /(^\s*(bearer|basic|token)\s+\S{8,})|\bsk-[A-Za-z0-9_-]{16,}|\bsk_(live|test)_[A-Za-z0-9]{8,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bxox[abprs]-[A-Za-z0-9-]{10,}|\bAKIA[0-9A-Z]{16}\b|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.|-----BEGIN [A-Z ]*PRIVATE KEY-----|\bhf_[A-Za-z0-9]{20,}\b|\bAIza[0-9A-Za-z_-]{30,}/i;

/**
 * Paths (never values) of everything in the request that looks like a credential. `payment.x_payment` is the
 * one exempt field: it is a signed, single-use x402 authorisation the caller made for a challenge the edge
 * relayed, not a key, and it is forwarded only under the phase-3 rule.
 */
export function credentialPaths(v: unknown, path = "$", out: string[] = []): string[] {
  if (out.length >= 16) return out;
  if (typeof v === "string") {
    if (CREDENTIAL_VALUE.test(v)) out.push(path);
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => credentialPaths(x, `${path}[${i}]`, out));
  } else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      const p = `${path}.${k.slice(0, 40)}`;
      if (p === "$.payment.x_payment") continue;
      if (CREDENTIAL_KEY.test(k)) out.push(p);
      else credentialPaths(x, p, out);
    }
  }
  return out;
}

/* ---------------------------------------------------------------- MCP client (streamable HTTP) */

type McpOutcome =
  | { kind: "ok"; http_status: number; result: Record<string, unknown>; response_sha256: string; latency_ms: number }
  | { kind: "http_402"; http_status: 402; challenge: Record<string, unknown> | null; response_sha256: string; latency_ms: number }
  | { kind: "auth_required"; http_status: number; latency_ms: number }
  | { kind: "error"; http_status: number | null; detail: string; latency_ms: number };

async function readCapped(r: Response): Promise<string> {
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.byteLength > MAX_RESPONSE_BYTES) throw new Error(`response larger than ${MAX_RESPONSE_BYTES} bytes`);
  return new TextDecoder().decode(buf);
}

/** One JSON-RPC message from a JSON or SSE body: the one whose id matches. */
function rpcMessage(text: string, contentType: string, id: number): Record<string, any> | null {
  const pick = (o: unknown) => (o && typeof o === "object" && (o as any).id === id ? (o as Record<string, any>) : null);
  if (contentType.includes("text/event-stream")) {
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      try {
        const m = pick(JSON.parse(line.slice(5).trim()));
        if (m) return m;
      } catch {
        /* a non-JSON data line is skipped */
      }
    }
    return null;
  }
  try {
    const o = JSON.parse(text);
    return Array.isArray(o) ? o.map(pick).find(Boolean) ?? null : pick(o);
  } catch {
    return null;
  }
}

/**
 * initialize -> notifications/initialized -> tools/call, the way the effect-binding probe spoke to the same
 * servers. The request carries content-type, accept and the protocol version: no Authorization, no cookie.
 */
export async function mcpToolCall(
  fetchTarget: ExecuteDeps["fetchTarget"],
  endpoint: string,
  tool: string,
  args: Record<string, unknown>,
): Promise<McpOutcome> {
  const t0 = Date.now();
  const base: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": MCP_PROTOCOL_VERSION,
  };
  const post = (body: unknown, extra: Record<string, string> = {}) =>
    fetchTarget(endpoint, {
      method: "POST",
      headers: { ...base, ...extra },
      body: JSON.stringify(body),
      redirect: "follow",
      signal: AbortSignal.timeout(TARGET_TIMEOUT_MS),
    });
  const ms = () => Date.now() - t0;
  try {
    const init = await post({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: MCP_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "gspc-route", version: EXECUTE_VERSION } },
    });
    if (init.status === 401 || init.status === 403) return { kind: "auth_required", http_status: init.status, latency_ms: ms() };
    if (init.status === 402) {
      const text = await readCapped(init);
      let ch: Record<string, unknown> | null = null;
      try { ch = JSON.parse(text); } catch { ch = null; }
      return { kind: "http_402", http_status: 402, challenge: ch, response_sha256: await sha256Hex(text), latency_ms: ms() };
    }
    if (!init.ok) return { kind: "error", http_status: init.status, detail: "initialize failed", latency_ms: ms() };
    await readCapped(init);
    const sid = init.headers.get("mcp-session-id");
    const sess: Record<string, string> = sid ? { "mcp-session-id": sid } : {};
    const note = await post({ jsonrpc: "2.0", method: "notifications/initialized" }, sess);
    await note.arrayBuffer().catch(() => undefined);
    const r = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: tool, arguments: args } }, sess);
    if (r.status === 401 || r.status === 403) return { kind: "auth_required", http_status: r.status, latency_ms: ms() };
    const text = await readCapped(r);
    const sha = await sha256Hex(text);
    if (r.status === 402) {
      let ch: Record<string, unknown> | null = null;
      try { ch = JSON.parse(text); } catch { ch = null; }
      return { kind: "http_402", http_status: 402, challenge: ch, response_sha256: sha, latency_ms: ms() };
    }
    const msg = rpcMessage(text, r.headers.get("content-type") ?? "", 2);
    if (!r.ok || !msg) return { kind: "error", http_status: r.status, detail: msg ? "HTTP error" : "no JSON-RPC answer to tools/call", latency_ms: ms() };
    if (msg.error) return { kind: "error", http_status: r.status, detail: `JSON-RPC error ${String(msg.error.code ?? "")}`.trim(), latency_ms: ms() };
    return { kind: "ok", http_status: r.status, result: (msg.result ?? {}) as Record<string, unknown>, response_sha256: sha, latency_ms: ms() };
  } catch (e) {
    return { kind: "error", http_status: null, detail: e instanceof Error && e.name === "TimeoutError" ? "timeout" : "unreachable", latency_ms: ms() };
  }
}

/** The x402 PaymentRequired object in a tool result or 402 body, or null. Only x402Version + accepts[] count. */
export function x402Challenge(x: unknown): Record<string, unknown> | null {
  const o = x as Record<string, any> | null;
  const sc = (o?.structuredContent ?? o) as Record<string, any> | null;
  if (sc && typeof sc === "object" && typeof sc.x402Version === "number" && Array.isArray(sc.accepts) && sc.accepts.length)
    return { x402Version: sc.x402Version, accepts: sc.accepts, ...(sc.resource ? { resource: sc.resource } : {}) };
  return null;
}

/** What the caller confirms: sha256 of the JCS of {x402Version, accepts[, resource]}. */
export async function challengeSha(ch: Record<string, unknown>): Promise<string> {
  return sha256Hex(jcs(ch));
}

/* ---------------------------------------------------------------- the plan */

type Where = "server" | "client_side" | "none";

function isFirstParty(c: Candidate): boolean {
  return c.source === "gspc_fleet";
}

/** The edge's own endpoint for a first-party tool: same path, this deployment's origin. */
function firstPartyUrl(c: Candidate, origin: string): string {
  return `${origin.replace(/\/+$/, "")}${new URL(c.endpoint as string).pathname}`;
}

/** Why the edge may not call this candidate itself, or null when it may (read-only, free, verified). */
export function serverSideRefusal(c: Candidate): string | null {
  if (c.kind !== "mcp_tool" || !c.tool) return "not an MCP tool call";
  if (c.local || !c.endpoint || c.endpoint.startsWith("local:")) return "caller-run endpoint";
  if (isFirstParty(c)) return null; // first-party: paid and action flows are handled by phase 3/4
  if (c.paid) return "third-party paid resource: the caller pays from their own wallet, client-side";
  if (c.destructive) return "third-party destructive tool: never called by the edge";
  if (c.census.tool?.listed_read_only !== true)
    return "tool is not verified read-only (the signed effect-binding probe did not list it in read_only_tools)";
  return null;
}

function clientPlan(c: Candidate, callArgs: Record<string, unknown>, why: string) {
  return {
    where: "client_side",
    why,
    per_call_confirm: true,
    endpoint: c.endpoint,
    jsonrpc: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: c.tool, arguments: callArgs } },
    note:
      "Send this from your own machine with your own credentials, after confirming this one call. The GSPC edge " +
      "never receives, forwards, logs or stores a caller credential, and never calls a third-party tool that is not " +
      "verified read-only.",
  };
}

/* ---------------------------------------------------------------- execute */

function bad(errors: string[], status = 400): ExecuteResult {
  return { http_status: status, body: { state: "BAD_ARGUMENTS", errors, executed: false, charged: false } };
}

export async function routeExecute(args: Record<string, unknown>, deps: ExecuteDeps): Promise<ExecuteResult> {
  // Phase 2, first: a credential anywhere refuses the whole request before any rule, read or call runs.
  const creds = credentialPaths(args);
  if (creds.length)
    return {
      http_status: 400,
      body: {
        state: "CREDENTIALS_REFUSED",
        paths: creds,
        executed: false,
        charged: false,
        note:
          "This request carried something shaped like a credential at the paths listed (values are not echoed, logged " +
          "or stored). Caller credentials are used client-side only: call again without them and the answer for a target " +
          "that needs them is a CLIENT_SIDE plan you run yourself.",
      },
    };
  if ("signer" in deps && "unavailable" in (deps.signer as object))
    return {
      http_status: 503,
      body: {
        state: "SIGNER_UNAVAILABLE",
        reason: (deps.signer as { unavailable: string }).unavailable,
        executed: false,
        charged: false,
        note: "Execution needs a signed receipt under did:web:csoai.org#route-attestation-1; without one nothing is called.",
      },
    };
  const signer = deps.signer as Signer;

  const call = (args.call ?? {}) as Record<string, unknown>;
  if (typeof call !== "object" || Array.isArray(call)) return bad(["call must be an object: { arguments?: {...} }"]);
  for (const k of Object.keys(call)) if (k !== "arguments") return bad([`unknown call key "${k.slice(0, 40)}"`]);
  const callArgs = (call.arguments ?? {}) as Record<string, unknown>;
  if (typeof callArgs !== "object" || Array.isArray(callArgs) || callArgs === null) return bad(["call.arguments must be an object"]);
  if (new TextEncoder().encode(JSON.stringify(callArgs)).byteLength > MAX_ARGS_BYTES)
    return bad([`call.arguments larger than ${MAX_ARGS_BYTES} bytes`]);
  if ("x_payment" in callArgs) return bad(["x_payment goes in payment.x_payment, never in call.arguments"]);
  const payment = (args.payment ?? null) as Record<string, unknown> | null;
  if (payment !== null) {
    if (typeof payment !== "object" || Array.isArray(payment)) return bad(["payment must be { x_payment, challenge_sha256 }"]);
    for (const k of Object.keys(payment))
      if (k !== "x_payment" && k !== "challenge_sha256") return bad([`unknown payment key "${k.slice(0, 40)}"`]);
  }
  if (args.confirm_action !== undefined && typeof args.confirm_action !== "boolean") return bad(["confirm_action must be true or false"]);

  const routeArgs: Record<string, unknown> = { ...args };
  for (const k of ["call", "payment", "confirm_action", "mode"]) delete routeArgs[k];
  const { result, internals } = await routeCore(routeArgs, deps);
  if (!internals) return { http_status: 400, body: { ...result, executed: false, charged: false } };

  const rec = structuredClone(result.record) as Record<string, any>;
  const c = internals.candidates.find((x) => x.id === internals.decision.chosen?.id) ?? null;
  const argsSha = await sha256Hex(jcs(callArgs));
  const exec: Record<string, unknown> = {
    mode: "decide_only",
    status: "NOT_EXECUTED",
    where: "none" as Where,
    target: c
      ? { id: c.id, tool: c.tool, endpoint_sha256: c.endpoint ? await sha256Hex(c.endpoint) : null, first_party: isFirstParty(c) }
      : null,
    request_sha256: argsSha,
    response_sha256: null,
    http_status: null,
    latency_ms: null,
    provider_observed: null,
    model_observed: null,
    usage: null,
    cost_declared: null,
    receipt_schema: "csoai.route-receipt/0.1",
    receipt: null,
    method_version: EXECUTE_VERSION,
  };
  const pay: Record<string, unknown> = { x402: "none", tx: null, payer_is_self: false, challenge_sha256: null };
  let state = result.state;
  let http = 200;
  const out: Record<string, unknown> = {};

  const finish = async (): Promise<ExecuteResult> => {
    rec.observed.execution = exec;
    rec.observed.payment = pay;
    rec.method = { ...rec.method, version: `${rec.method.version}+execute-${EXECUTE_VERSION}` };
    rec.limits = [
      ROUTE_LIMITS[0],
      exec.mode === "executed"
        ? "Executed: the edge called the target once; the arguments and the target's answer are carried as sha256 only. The answer is returned to the caller and not stored. It is not a quality verdict on the answer."
        : "Not executed by the edge: see observed.execution.status; nothing was called on the caller's behalf.",
      `Signed under ${signer.kid}: the signature says who wrote these bytes and that they are unchanged, nothing about the target's answer.`,
      ROUTE_LIMITS[3],
      censusLimit(internals.census),
      ROUTE_LIMITS[4],
    ];
    await signRecord(rec, signer);
    return {
      http_status: http,
      body: {
        state,
        executed: exec.mode === "executed",
        charged: pay.x402 === "settled",
        chosen: result.chosen,
        forbidden: result.forbidden,
        ...out,
        receipt: rec,
        verify: {
          kid: signer.kid,
          did: "https://csoai.org/.well-known/did.json",
          how: "recompute event_id (sha256 of RFC 8785 JCS of the record minus event_id, signature, anchors), then check the Ed25519 signature over the event_id string",
        },
      },
    };
  };

  if (!c) {
    exec.status = state; // NO_PERMITTED_CANDIDATE: the policy refused everything; nothing is called
    return finish();
  }
  const refusal = serverSideRefusal(c);
  if (refusal) {
    state = "CLIENT_SIDE";
    exec.status = "CLIENT_SIDE";
    exec.where = "client_side";
    out.client_side = clientPlan(c, callArgs, refusal);
    return finish();
  }

  const url = isFirstParty(c) ? firstPartyUrl(c, deps.origin) : (c.endpoint as string);
  // Phase 4: a first-party tool that is not read-only runs only on an explicit confirm.
  if (isFirstParty(c) && !c.read_only && args.confirm_action !== true) {
    state = "CONFIRM_REQUIRED";
    exec.status = state;
    http = 409;
    out.confirm = { field: "confirm_action", value: true, tool: c.tool, note: "This tool is not read-only. Nothing was called." };
    return finish();
  }

  exec.where = "server";
  const first = await mcpToolCall(deps.fetchTarget, url, c.tool as string, callArgs);
  const challenge = first.kind === "ok" ? x402Challenge(first.result) : first.kind === "http_402" ? x402Challenge(first.challenge) : null;

  if (challenge && !isFirstParty(c)) {
    // A third party asking for payment is paid by the caller, client-side; the edge relays no third-party money.
    state = "CLIENT_SIDE";
    exec.status = "THIRD_PARTY_PAYMENT_REQUIRED";
    exec.where = "client_side";
    exec.latency_ms = first.latency_ms;
    out.client_side = clientPlan(c, callArgs, "the third-party target asked for payment; pay it from your own wallet, client-side");
    out.challenge = challenge;
    return finish();
  }
  if (c.paid || challenge) {
    // Phase 3. No 402 challenge observed => nothing is paid, whatever the caller sent.
    if (!challenge) {
      state = "NO_CHALLENGE";
      exec.status = state;
      exec.http_status = "http_status" in first ? first.http_status : null;
      exec.latency_ms = first.latency_ms;
      http = 502;
      out.note = "The paid target did not answer with an x402 challenge; the edge pays only against a challenge it observed. Nothing was paid.";
      return finish();
    }
    const sha = await challengeSha(challenge);
    pay.x402 = "challenge";
    pay.challenge_sha256 = sha;
    const xp = typeof payment?.x_payment === "string" ? payment.x_payment.trim() : "";
    const confirmed = xp !== "" && payment?.challenge_sha256 === sha && internals.policy.caller_wallet;
    if (!confirmed) {
      state = "PAYMENT_REQUIRED";
      exec.status = state;
      exec.http_status = 402;
      exec.latency_ms = first.latency_ms;
      http = 402;
      out.payment_required = {
        challenge,
        challenge_sha256: sha,
        confirm:
          "Show the amount in accepts[] to the payer. To pay, sign accepts[0] with YOUR wallet and call again with " +
          "payment: { x_payment: <signed payload>, challenge_sha256: <this challenge_sha256> } and policy.caller_wallet: true. " +
          "A confirm for any other challenge pays nothing.",
      };
      return finish();
    }
    const paid = await mcpToolCall(deps.fetchTarget, url, c.tool as string, { ...callArgs, x_payment: xp });
    exec.mode = "executed";
    exec.latency_ms = paid.latency_ms;
    exec.http_status = "http_status" in paid ? paid.http_status : null;
    if (paid.kind !== "ok") {
      state = "TARGET_ERROR";
      exec.status = state;
      http = 502;
      return finish();
    }
    exec.response_sha256 = paid.response_sha256;
    const sc = (paid.result.structuredContent ?? {}) as Record<string, unknown>;
    if (sc.settlement_state === "REPORTED_BY_ROUTE") {
      pay.x402 = "settled";
      pay.tx = typeof sc.payment_response_header === "string" ? sc.payment_response_header : null;
    }
    state = x402Challenge(paid.result) ? "PAYMENT_REJECTED" : "EXECUTED";
    exec.status = state;
    out.result = paid.result;
    return finish();
  }

  exec.latency_ms = first.latency_ms;
  exec.http_status = "http_status" in first ? first.http_status : null;
  if (first.kind === "auth_required") {
    state = "CLIENT_SIDE";
    exec.status = "TARGET_REQUIRES_AUTH";
    exec.where = "client_side";
    out.client_side = clientPlan(c, callArgs, `the target answered HTTP ${first.http_status}: it needs a credential, which stays with you`);
    return finish();
  }
  if (first.kind !== "ok") {
    state = "TARGET_ERROR";
    exec.status = state;
    http = 502;
    out.error = first.kind === "error" ? first.detail : "unexpected answer";
    return finish();
  }
  exec.mode = "executed";
  exec.status = "EXECUTED";
  exec.response_sha256 = first.response_sha256;
  state = "EXECUTED";
  out.result = first.result;
  return finish();
}

export type { RouteResult };
