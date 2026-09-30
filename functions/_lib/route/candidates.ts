/**
 * GSPC Route: the candidate set.
 *
 * Two sources: the GSPC MCP fleet (gspc-tools.json + paid-tools.json, as tools/list serves them) and
 * candidates the CALLER declares (their own models, their local GPU, their MCP servers, x402 URLs).
 *
 * The openshell-cedar rule, carried over: nothing the router does not fully understand becomes an allow.
 * A caller-declared field the router does not know makes that candidate UNCHECKABLE, and an
 * UNCHECKABLE candidate is never permitted. The one exception is a closed list of COMMERCIAL fields
 * (sponsor, bid, paid placement, ...): they are dropped before any rule sees them and listed in the
 * record, so money can neither buy a route nor, by being refused, cost one.
 */
import FREE from "../../mcp/gspc-tools.json";
import PAID from "../../mcp/paid-tools.json";
import {
  CANDIDATE_KINDS,
  DATA_CLASSES,
  type Candidate,
  type CandidateKind,
  type DataClass,
} from "./types";

/** Dropped, never read. Money is not an input to any rule or to the tie-break. */
export const COMMERCIAL_FIELDS = new Set([
  "sponsor",
  "sponsored",
  "sponsorship",
  "paid_placement",
  "placement",
  "promoted",
  "boost",
  "bid",
  "bid_usd",
  "affiliate",
  "commission",
  "referral",
  "advertiser",
  "ad",
  "priority_fee",
  "rank_fee",
]);

const KNOWN_FIELDS = new Set([
  "id",
  "kind",
  "provider",
  "model",
  "region",
  "endpoint",
  "cost_declared",
  "latency_declared_ms",
  "read_only",
  "destructive",
  "paid",
  "data_class_allowed",
]);

export const MAX_CANDIDATES = 32;
/** Characters a caller id, provider, model or region may use: they are rendered into Cedar strings. */
export const SAFE_TOKEN = /^[A-Za-z0-9._:/@+\-]{1,120}$/;

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

/** true for a host the edge must never be pointed at: loopback, RFC 1918, link-local, ULA, .local. */
export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (PRIVATE_V4.some((re) => re.test(h))) return true;
  if (h === "::1" || h === "::" || /^f[cd][0-9a-f]{2}:/.test(h) || /^fe80:/.test(h)) return true;
  if (/^::ffff:/.test(h)) return isPrivateHost(h.slice(7));
  return false;
}

/** https://public-host/... or local:<name> (a caller-run endpoint the caller executes itself). */
export function checkEndpoint(endpoint: string): string | null {
  if (endpoint.startsWith("local:")) return SAFE_TOKEN.test(endpoint) ? null : "endpoint local:<name> has characters outside [A-Za-z0-9._:/@+-]";
  let u: URL;
  try {
    u = new URL(endpoint);
  } catch {
    return "endpoint is not a URL";
  }
  if (u.protocol !== "https:") return "endpoint must be https:// (or local:<name> for a caller-run endpoint)";
  if (u.username || u.password) return "endpoint carries credentials";
  if (isPrivateHost(u.hostname)) return "endpoint host is private or loopback; use local:<name> for a caller-run endpoint";
  return null;
}

type ToolDef = { name: string; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean } };

/** The GSPC MCP fleet as route candidates. `route` itself is never a candidate for its own decision. */
export function fleetCandidates(): Candidate[] {
  const free = (FREE as { tools: ToolDef[] }).tools;
  const paid = (PAID as { tools: ToolDef[] }).tools;
  const mk = (t: ToolDef, isPaid: boolean): Candidate => ({
    id: `mcp:${t.name}`,
    kind: "mcp_tool",
    provider: "csoai",
    model: null,
    region: "",
    endpoint: isPaid ? "https://councilof.ai/mcp" : "https://councilof.ai/mcp/free",
    local: false,
    read_only: t.annotations?.readOnlyHint === true,
    destructive: t.annotations?.destructiveHint === true,
    paid: isPaid,
    data_class_allowed: ["public"],
    cost_declared: null,
    latency_declared_ms: null,
    source: "gspc_fleet",
    census: { effect_binding: "UNMEASURED" },
    uncheckable: [],
    ignored_fields: [],
  });
  return [
    ...free.filter((t) => t.name !== "route").map((t) => mk(t, false)),
    ...paid.map((t) => mk(t, true)),
  ];
}

const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isNonNegNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/**
 * Normalise ONE caller-declared candidate. Never throws: every problem becomes an UNCHECKABLE reason,
 * and the candidate stays in the record (with permit=false) so the caller can see why.
 */
export function normaliseCandidate(raw: unknown, index: number): Candidate {
  const why: string[] = [];
  const ignored: string[] = [];
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!o) why.push("candidate is not an object");
  const rec = o ?? {};
  for (const k of Object.keys(rec).sort()) {
    if (COMMERCIAL_FIELDS.has(k)) ignored.push(k);
    else if (!KNOWN_FIELDS.has(k)) why.push(`unknown attribute "${k.slice(0, 40)}"`);
  }
  const str = (k: string): string | null => {
    const v = rec[k];
    if (v === undefined || v === null) return null;
    if (typeof v !== "string" || !SAFE_TOKEN.test(v)) {
      why.push(`${k} must be a string of [A-Za-z0-9._:/@+-], 1-120 characters`);
      return null;
    }
    return v;
  };
  const id = str("id") ?? `candidate-${index}`;
  if (rec.id === undefined) why.push("id is required");
  const kindRaw = rec.kind;
  const kind: CandidateKind = (CANDIDATE_KINDS as readonly string[]).includes(String(kindRaw))
    ? (kindRaw as CandidateKind)
    : (why.push(`kind must be one of ${CANDIDATE_KINDS.join(", ")}`), "model");
  const provider = str("provider") ?? "";
  const model = str("model");
  const region = str("region") ?? "";
  let endpoint: string | null = null;
  if (rec.endpoint !== undefined && rec.endpoint !== null) {
    if (typeof rec.endpoint !== "string" || rec.endpoint.length > 300) why.push("endpoint must be a string of at most 300 characters");
    else {
      const bad = checkEndpoint(rec.endpoint);
      if (bad) why.push(bad);
      endpoint = rec.endpoint;
    }
  }
  const bool = (k: string, dflt: boolean): boolean => {
    const v = rec[k];
    if (v === undefined) return dflt;
    if (!isBool(v)) {
      why.push(`${k} must be true or false`);
      return dflt;
    }
    return v;
  };
  // Defaults are the narrow reading: an undeclared tool is NOT assumed read-only, and an undeclared
  // destructive flag is false only because the floor forbids destructive without confirm anyway.
  const read_only = bool("read_only", false);
  const destructive = bool("destructive", false);
  const paid = bool("paid", kind === "x402_resource");
  const num = (k: string): number | null => {
    const v = rec[k];
    if (v === undefined || v === null) return null;
    if (!isNonNegNumber(v)) {
      why.push(`${k} must be a non-negative finite number`);
      return null;
    }
    return v;
  };
  const cost_declared = num("cost_declared");
  const latency_declared_ms = num("latency_declared_ms");
  let data_class_allowed: DataClass[] = ["public"];
  if (rec.data_class_allowed !== undefined) {
    const v = rec.data_class_allowed;
    if (!Array.isArray(v) || !v.every((x) => (DATA_CLASSES as readonly string[]).includes(String(x))))
      why.push(`data_class_allowed must be a list drawn from ${DATA_CLASSES.join(", ")}`);
    else data_class_allowed = [...new Set(v as DataClass[])].sort();
  }
  const local = kind === "local_gpu" || (endpoint?.startsWith("local:") ?? false);
  if (kind === "local_gpu" && endpoint && !endpoint.startsWith("local:"))
    why.push("a local_gpu candidate's endpoint must be local:<name>");
  return {
    id,
    kind,
    provider,
    model,
    region,
    endpoint,
    local,
    read_only,
    destructive,
    paid,
    data_class_allowed,
    cost_declared,
    latency_declared_ms,
    source: "caller_declared",
    census: { effect_binding: "UNMEASURED" },
    uncheckable: why,
    ignored_fields: ignored,
  };
}

export function buildCandidates(raw: unknown): { candidates: Candidate[]; errors: string[] } {
  if (raw === undefined || raw === null) return { candidates: fleetCandidates(), errors: [] };
  if (!Array.isArray(raw)) return { candidates: [], errors: ["candidates must be a list"] };
  if (raw.length > MAX_CANDIDATES) return { candidates: [], errors: [`at most ${MAX_CANDIDATES} candidates`] };
  const out = raw.map((c, i) => normaliseCandidate(c, i));
  const seen = new Set<string>();
  for (const c of out) {
    if (seen.has(c.id)) c.uncheckable.push("duplicate id");
    seen.add(c.id);
  }
  return { candidates: out, errors: [] };
}
