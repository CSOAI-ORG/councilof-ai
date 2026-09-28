/**
 * GET /api/measurement/fresh-capsule?endpoint=<https MCP URL>&dimension=TOOLS|VERSION|PROTOCOL
 *
 * ONE paid door: re-measure ONE declared-vs-observed claim about ONE MCP endpoint, on demand, and
 * hand back a fresh measurement capsule (csoai.measurement-capsule/0.2). The rule is the
 * contract_parity adapter's, re-run live for a single (endpoint, dimension):
 *   declared  = what the endpoint's own discovery documents state (/.well-known/mcp/server-card.json,
 *               /.well-known/mcp.json on the endpoint's origin) — each read sha256'd;
 *   observed  = the live discovery boundary: initialize, then tools/list — each read sha256'd;
 *   state     = CONSISTENT / INCONSISTENT when two or more surfaces spoke to the dimension,
 *               UNCHECKABLE (with the reason) when fewer than two did. Never a verdict.
 * Nothing beyond the discovery boundary is ever sent: no tools/call, no credentials, no payment.
 *
 *   ?preview=1   free — the same measurement, unsigned and without source digests.
 *   (no header)  402 — the challenge. Priced like every per-request door (SKU request_attestation /
 *                per_request, the /api/wrapper pattern); the amount lives only in the challenge.
 *   X-PAYMENT    READ BEFORE SETTLE: the endpoint is read first; if the live read failed or fewer
 *                than two surfaces spoke, the 402 is answered again with the reason and nothing
 *                settles. Otherwise the capsule, its id, and a board signature over a compact
 *                payload that pins the id (did:web:csoai.org#board-attestation-1, when the Pages key
 *                is present; declared unsigned otherwise).
 *
 * Verification stays free: MCP verify_capsule / server_evidence and GET /measurement-capsules/*.
 * A fresh capsule is NOT in any published batch until a later batch includes it; it says so.
 * The listing in /.well-known/x402.json is built by freshCapsulePaymentRequired() — the same call
 * this door answers with — so listing and challenge cannot differ (fresh-capsule.test.ts).
 */
import { headFromGet } from "../_head";
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  hasPaymentHeader,
  CSOAI_LID,
  type X402Env,
} from "../_x402";
import { railMode } from "../_x402_config";
import { signPayload, canonicalBytes, sha256Hex } from "../../_lib/cardSign";
import { DOCTRINE, normaliseEndpoint } from "../../_lib/measurementCapsule";
import { FRESH_CAPSULE_DESCRIPTION } from "../_x402_descriptions";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string };
type Json = Record<string, unknown>;

export const PATH = "/api/measurement/fresh-capsule";
export const SKU = { skuId: "request_attestation", tier: "per_request" } as const;
export const DIMENSIONS = ["TOOLS", "VERSION", "PROTOCOL"] as const;
type Dimension = (typeof DIMENSIONS)[number];
const SCHEMA = "csoai.measurement-capsule/0.2";
const KIND = "measurement.contract_parity";
const AUTHORITY = "NONE: measurement only; this capsule grants and records no execution authority";
// The contract_parity adapter's own statements and limits, word for word where they apply.
const STATEMENT: Record<Dimension, string> = {
  PROTOCOL: "the MCP protocol version the surfaces declare is the one the live server negotiates",
  TOOLS: "the tool set the surfaces declare is the tool set the live server lists",
  VERSION: "the server version the registry and cards state is the version the live server reports",
};
const LIMITS = [
  "discovery boundary only (initialize + tools/list); tools/call, credentials and payments were never sent",
  "INCONSISTENT says two public statements disagree, not which one is true",
  "on-demand single read from one network location; not part of any signed batch until a later batch includes it",
  "declared surfaces read: the endpoint origin's /.well-known/mcp/server-card.json and /.well-known/mcp.json only",
];
// Canonical text: functions/api/x402-descriptions.json (fresh_capsule) — the one source every surface reads.
const DESCRIPTION = FRESH_CAPSULE_DESCRIPTION;
const READ_TIMEOUT_MS = 10_000;
const READ_CAP_BYTES = 1 << 20;
const PROTOCOL_REQUESTED = "2025-06-18";

/** The one 402 this door answers with; x402.json lists exactly this (listing = challenge). */
export function freshCapsulePaymentRequired(env: X402Env, origin: string, notPaidReason?: string, extra: Json = {}) {
  const resourceUrl = `${origin}${PATH}`;
  const accepts = x402Accepts(env, resourceUrl, { ...SKU, description: DESCRIPTION });
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    queryParams: { endpoint: "https://example.com/mcp", dimension: "TOOLS" },
    queryParamsSchema: {
      properties: {
        endpoint: { type: "string", description: "https URL of one MCP endpoint (Streamable HTTP)" },
        dimension: { type: "string", enum: [...DIMENSIONS], description: "which declared-vs-observed claim to re-measure" },
      },
      required: ["endpoint", "dimension"],
    },
    outputExample: { capsule: { schema: SCHEMA, kind: KIND, subject_id: "https://example.com/mcp", measurement_state: "CONSISTENT", capsule_id: "<hex>" }, signature: { sig_ed25519: "<hex or null>" } },
  });
  const paymentRequired = buildPaymentRequiredV2({
    resourceUrl,
    description: DESCRIPTION,
    serviceName: "CSOAI Fresh Capsule",
    tags: ["mcp", "measurement", "parity", "evidence", "x402"],
    accepts,
    bazaar,
    csoai: {
      schema: SCHEMA,
      per: "endpoint-dimension-request",
      lid: CSOAI_LID,
      never: ["rating", "guarantee", "verdict", "rank", "certificate", "endorsement"],
      deliverable: "one csoai.measurement-capsule/0.2 (kind measurement.contract_parity) + board signature over a payload pinning its capsule_id",
      free_preview: `${resourceUrl}?endpoint=<url>&dimension=TOOLS&preview=1`,
      free_verification: [`${origin}/mcp (verify_capsule, server_evidence)`, `${origin}/measurement-capsules/latest.json`],
      rail: railMode(env),
      catalog: `${origin}/api/x402`,
      ...(notPaidReason ? { not_paid_reason: notPaidReason } : {}),
      ...extra,
    },
  });
  return { resourceUrl, accepts, bazaar, paymentRequired };
}

/* ---------------------------------------------------------------- live reads */

function refuseTarget(u: URL): string | null {
  if (u.protocol !== "https:") return "endpoint must be https";
  if (u.username || u.password) return "endpoint must not carry credentials";
  if (u.port && u.port !== "443") return "endpoint must use the default https port";
  const h = u.hostname.toLowerCase();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.startsWith("[") || h.includes(":")) return "endpoint must be a DNS name, not an IP literal";
  if (h === "localhost" || /\.(localhost|local|internal|lan|home|arpa)$/.test(h) || !h.includes(".")) return "endpoint must be a public DNS name";
  return null;
}

type Read = { url: string; ok: boolean; status: number | null; sha256: string | null; json: unknown; error?: string; session?: string | null };

async function boundedRead(url: string, init: RequestInit): Promise<Read> {
  try {
    const r = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(READ_TIMEOUT_MS) });
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.byteLength > READ_CAP_BYTES) return { url, ok: false, status: r.status, sha256: null, json: null, error: "response over 1 MiB" };
    const text = new TextDecoder().decode(buf);
    const sha256 = await sha256Hex(buf);
    let json: unknown = null;
    const ct = r.headers.get("content-type") ?? "";
    try {
      if (ct.includes("text/event-stream")) {
        const frames = text.replace(/\r\n/g, "\n").split(/\n\n/).map((ev) => ev.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")).filter(Boolean);
        json = frames.length ? JSON.parse(frames[frames.length - 1]) : null;
      } else json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { url, ok: r.ok, status: r.status, sha256, json, session: r.headers.get("mcp-session-id") };
  } catch (e) {
    return { url, ok: false, status: null, sha256: null, json: null, error: (e as Error).name === "TimeoutError" ? "timed out" : "fetch failed" };
  }
}

const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);
const toolNames = (v: unknown): string[] | null =>
  Array.isArray(v) ? [...new Set(v.map((t) => (typeof t === "string" ? t : typeof rec(t)?.name === "string" ? String(rec(t)!.name) : null)).filter((x): x is string => !!x))].sort() : null;

/** What one discovery document declares for each dimension (null = says nothing about it). */
function declares(doc: unknown): Record<Dimension, unknown> {
  const d = rec(doc) ?? {};
  const server = rec(d.serverInfo) ?? rec(d.server) ?? {};
  const pv = d.protocolVersion ?? d.protocol_version ?? d.protocolVersions ?? d.supportedProtocolVersions ?? rec(d.transport)?.protocolVersion;
  return {
    TOOLS: toolNames(d.tools ?? rec(d.capabilities)?.tools),
    VERSION: typeof (server.version ?? d.version) === "string" ? String(server.version ?? d.version) : null,
    PROTOCOL: typeof pv === "string" ? [pv] : Array.isArray(pv) ? pv.filter((x) => typeof x === "string") : null,
  };
}

export async function measure(endpoint: string, dimension: Dimension) {
  const origin = new URL(endpoint).origin;
  const observedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const docs = await Promise.all([`${origin}/.well-known/mcp/server-card.json`, `${origin}/.well-known/mcp.json`].map((u) => boundedRead(u, { headers: { accept: "application/json" } })));
  const headers = { "content-type": "application/json", accept: "application/json, text/event-stream", "user-agent": "csoai-fresh-capsule/0.2 (+https://councilof.ai/api/x402)" };
  const init = await boundedRead(endpoint, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: PROTOCOL_REQUESTED, capabilities: {}, clientInfo: { name: "csoai-fresh-capsule", version: "0.2" } } }) });
  const initResult = rec(rec(init.json)?.result);
  const sess = init.session ? { "mcp-session-id": init.session } : {};
  let list: Read | null = null;
  if (initResult) {
    const negotiated = typeof initResult.protocolVersion === "string" ? initResult.protocolVersion : PROTOCOL_REQUESTED;
    await boundedRead(endpoint, { method: "POST", headers: { ...headers, ...sess, "mcp-protocol-version": negotiated }, body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) });
    list = await boundedRead(endpoint, { method: "POST", headers: { ...headers, ...sess, "mcp-protocol-version": negotiated }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) });
  }
  const live: Record<Dimension, unknown> = {
    PROTOCOL: typeof initResult?.protocolVersion === "string" ? initResult.protocolVersion : null,
    VERSION: typeof rec(initResult?.serverInfo)?.version === "string" ? String(rec(initResult!.serverInfo)!.version) : null,
    TOOLS: list ? toolNames(rec(rec(list.json)?.result)?.tools) : null,
  };
  const declared = docs
    .filter((r) => r.ok && r.json !== null)
    .map((r) => ({ surface: r.url.endsWith("server-card.json") ? "server_card" : "mcp_json", url: r.url, value: declares(r.json)[dimension] }))
    .filter((d) => d.value !== null && !(Array.isArray(d.value) && d.value.length === 0 && dimension === "PROTOCOL"));
  const liveValue = live[dimension];
  const speaking = [...declared.map((d) => d.surface), ...(liveValue !== null ? ["live"] : [])];
  let state: "CONSISTENT" | "INCONSISTENT" | "UNCHECKABLE";
  let reason: string | null = null;
  if (liveValue === null && !initResult) {
    state = "UNCHECKABLE";
    reason = `LIVE_READ_FAILED (${init.error ?? `HTTP ${init.status}`})`;
  } else if (speaking.length < 2) {
    state = "UNCHECKABLE";
    reason = declared.length ? "NO_LIVE_VALUE" : "NO_DECLARING_SURFACE";
  } else {
    const agrees = (v: unknown) =>
      dimension === "PROTOCOL"
        ? liveValue === null || (v as string[]).includes(String(liveValue))
        : JSON.stringify(v) === JSON.stringify(liveValue);
    const values = declared.map((d) => d.value);
    const allAgree = liveValue === null
      ? values.every((v) => JSON.stringify(v) === JSON.stringify(values[0]))
      : values.every(agrees);
    state = allAgree ? "CONSISTENT" : "INCONSISTENT";
  }
  const reads = [...docs, init, ...(list ? [list] : [])];
  const capsule: Json = {
    schema: SCHEMA,
    kind: KIND,
    subject_id: endpoint,
    claim: { dimension, statement: STATEMENT[dimension], mode: "on_demand" },
    declared: { declared },
    observed: {
      observed: liveValue,
      live_read: { protocol_version_requested: PROTOCOL_REQUESTED, protocol_version: live.PROTOCOL, server_version: live.VERSION, n_tools: Array.isArray(live.TOOLS) ? (live.TOOLS as string[]).length : null, initialize_status: init.status, tools_list_status: list?.status ?? null },
    },
    differential: { surfaces_speaking: speaking, ...(reason ? { reason } : {}) },
    sources: Object.fromEntries(reads.filter((r) => r.sha256).map((r, i) => [`read_${i}_sha256`, r.sha256])),
    measurement_state: state,
    authority_state: AUTHORITY,
    effect_reference: null,
    observed_at: observedAt,
    correction_pointer: null,
    limitations: LIMITS,
  };
  capsule.capsule_id = await sha256Hex(canonicalBytes(capsule));
  return { capsule, reads: reads.map((r) => ({ url: r.url, status: r.status, sha256: r.sha256, ...(r.error ? { error: r.error } : {}) })) };
}

/* -------------------------------------------------------------------- door */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const preview = url.searchParams.get("preview") === "1";
  const rawEndpoint = url.searchParams.get("endpoint") ?? "";
  const dimension = (url.searchParams.get("dimension") ?? "").toUpperCase() as Dimension;
  const endpoint = normaliseEndpoint(rawEndpoint);
  let why: string | null = null;
  if (!rawEndpoint) why = "pass endpoint=<https MCP URL>";
  else if (!endpoint) why = "endpoint is not a URL";
  else why = refuseTarget(new URL(endpoint));
  if (!why && !DIMENSIONS.includes(dimension)) why = `dimension must be one of ${DIMENSIONS.join(", ")}`;
  const bad = () => json({ schema: SCHEMA, error: "bad_request", reason: why, dimensions: DIMENSIONS, doctrine: DOCTRINE, settled: false }, 400);

  const challenge = (reason: string, extra: Json = {}) => paymentRequiredResponseSigned(freshCapsulePaymentRequired(env, origin, reason, extra).paymentRequired, env);
  const { resourceUrl, accepts, bazaar } = freshCapsulePaymentRequired(env, origin);

  // Unpaid bare GET stays 402 so an indexer can discover the door; bad input with a payment never settles.
  if (!preview && !hasPaymentHeader(request)) {
    return challenge((await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar })).reason);
  }
  if (why) return bad();

  const { capsule, reads } = await measure(endpoint!, dimension);
  const state = capsule.measurement_state as string;
  if (preview) {
    const { sources: _s, ...shown } = capsule;
    return json({ schema: SCHEMA, kind: "preview", doctrine: DOCTRINE, capsule: { ...shown, preview: true, preview_note: "unsigned preview — no source digests, no signature. The paid capsule carries both; its capsule_id covers the digests, so this preview's id is withheld.", capsule_id: null }, buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402` }, rail: railMode(env) });
  }
  // READ BEFORE SETTLE: charge only for a measurement where two or more surfaces spoke.
  if (state === "UNCHECKABLE") {
    return challenge(
      `read before settle: the measurement came back UNCHECKABLE (${String((capsule.differential as Json).reason)}). The payment was not sent to the facilitator, so nothing was settled. Check the free preview before paying again.`,
      { read_before_settle: { state, reason: (capsule.differential as Json).reason, settled: false } },
    );
  }
  const payload = {
    schema: "csoai.signed-artifact/0.1",
    artifact: { kind: "measurement-capsule", schema: SCHEMA, capsule_id: capsule.capsule_id, subject_id: capsule.subject_id, dimension, measurement_state: state, observed_at: capsule.observed_at },
    not_a_grade: "The signature proves the board key signed this capsule id; it proves nothing beyond the capsule's own measurement_state and limitations.",
  };
  let leaf;
  try {
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return json({ schema: SCHEMA, error: "uncheckable", reason: (e as Error).message, settled: false }, 500);
  }
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });
  if (!payment.ok) return challenge(payment.reason);
  return new Response(
    JSON.stringify({ schema: SCHEMA, doctrine: DOCTRINE, capsule, reads, signature: { payload, did: leaf.did, sha256: leaf.sha256, sig_ed25519: leaf.sig_ed25519, unsigned_reason: leaf.unsigned_reason }, in_published_batch: false, verify_free: `${origin}/mcp (verify_capsule after a batch includes it)` }, null, 2),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
        "x-csoai-capsule-id": String(capsule.capsule_id),
        "x-csoai-signed": leaf.sig_ed25519 ? "true" : "false",
        ...(payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
      },
    },
  );
};

/** Gold-402's gate POSTs {}. Query string still selects the paid tier; body is ignored. */
export const onRequestPost = onRequestGet;

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);
