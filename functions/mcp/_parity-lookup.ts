/**
 * MCP adapter for the free tool `parity_lookup` (functions/mcp/_parity-lookup.ts).
 *
 * Looks up published contract-parity and tool-surface-drift history for one server URL:
 * normalizes the endpoint URL using the canonical `normaliseEndpoint` rule shared with
 * `functions/_lib/measurementCapsule.ts`, reads the per-endpoint capsule shard under
 * `/measurement-capsules/v0.2/endpoints/<shard>.json` (and any matching Trust Index listing-parity
 * observations), and returns dated observations with diffs.
 *
 * Doctrine: measurement, never certification. Unknown URL returns `state: "NOT_MEASURED"` and
 * `observations: []` — never inferred, never zero-as-fail.
 */

import type { McpToolResult } from "./_trust-query";

export const PARITY_LOOKUP_TOOL_NAMES = new Set(["parity_lookup"]);

const DOCTRINE =
  "measurement, not certification — dated contract-parity and surface-drift observations, never a verdict or grade";

type Json = Record<string, unknown>;
type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const rec = (v: unknown): Json | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;

/**
 * Canonical endpoint normalizer (identical to functions/_lib/measurementCapsule.ts):
 * https/http only, lower-cased scheme and host, default port and fragment dropped,
 * trailing slash dropped except for the root path, query kept verbatim.
 */
export function normaliseEndpoint(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  const port =
    u.port &&
    !((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80"))
      ? `:${u.port}`
      : "";
  let path = u.pathname || "/";
  if (path.length > 1) path = path.replace(/\/+$/, "") || "/";
  return `${u.protocol}//${host}${port}${path}${u.search}`;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchJson(
  url: string,
  fetchImpl: FetchLike,
): Promise<{ ok: true; data: Json; url: string } | { ok: false; status: number; error: string; url: string }> {
  try {
    const res = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}`, url };
    const parsed = rec(await res.json());
    if (!parsed) return { ok: false, status: res.status, error: "invalid JSON object", url };
    return { ok: true, data: parsed, url };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
      url,
    };
  }
}

export async function parityLookupResult(
  origin: string,
  args: { url?: string; history?: boolean },
  fetchImpl: FetchLike = fetch,
): Promise<Json> {
  const rawUrl = typeof args.url === "string" ? args.url.trim() : "";
  if (!rawUrl) {
    return {
      state: "BAD_ARGUMENTS",
      reason: "url is required and must be an http(s) endpoint URL",
      url: null,
      observations: [],
      doctrine: DOCTRINE,
      not_a_certification: true,
    };
  }

  const normalised = normaliseEndpoint(rawUrl);
  if (!normalised) {
    return {
      state: "BAD_ARGUMENTS",
      reason: `url "${rawUrl}" is not a valid http(s) URL without credentials`,
      url: rawUrl,
      observations: [],
      doctrine: DOCTRINE,
      not_a_certification: true,
    };
  }

  const includeHistory = args.history === true;
  const endpointKey = await sha256Hex(normalised);
  const shardId = endpointKey.slice(0, 2);
  const shardUrl = `${origin}/measurement-capsules/v0.2/endpoints/${shardId}.json`;

  const shardRes = await fetchJson(shardUrl, fetchImpl);
  const sources: string[] = [shardUrl];
  const allObservations: Array<Record<string, unknown>> = [];

  if (shardRes.ok) {
    const endpoints = rec(shardRes.data.endpoints);
    const entry = rec(endpoints?.[endpointKey]);
    const capsules = Array.isArray(entry?.capsules) ? (entry!.capsules as Json[]) : [];

    for (const cap of capsules) {
      const adapter = String(cap.adapter ?? cap.kind ?? "");
      const mState = String(cap.measurement_state ?? cap.state ?? "MEASURED");
      const parityVal =
        mState === "CONSISTENT" || mState === "INCONSISTENT" || mState === "MISMATCH" || mState === "UNCHECKABLE"
          ? mState === "MISMATCH"
            ? "INCONSISTENT"
            : mState
          : typeof cap.parity === "string"
            ? cap.parity
            : "UNCHECKABLE";
      const driftVal =
        typeof cap.drift === "string"
          ? cap.drift
          : mState === "STABLE" || mState === "CHANGED" || mState === "FIRST_SEEN"
            ? mState
            : null;

      allObservations.push({
        as_of: cap.as_of ?? cap.observed_at ?? shardRes.data.as_of ?? null,
        adapter: adapter || null,
        parity: parityVal,
        measurement_state: mState,
        ...(Array.isArray(cap.diffs) ? { diffs: cap.diffs } : {}),
        drift: driftVal,
        ...(typeof cap.tool_count === "number" ? { tool_count: cap.tool_count } : {}),
        capsule_id: cap.capsule_id ?? null,
        source_batch: cap.batch ?? cap.slug ?? null,
        batch_merkle_root: cap.batch_merkle_root ?? shardRes.data.index_root ?? null,
      });
    }
  }

  // Also check latest Trust Index edition for listing-parity on this URL
  const indexUrl = `${origin}/trust-index/latest.json`;
  const indexRes = await fetchJson(indexUrl, fetchImpl);
  if (indexRes.ok) {
    sources.push(indexUrl);
    const entries = Array.isArray(indexRes.data.entries) ? (indexRes.data.entries as Json[]) : [];
    for (const e of entries) {
      const eNorm = typeof e.url === "string" ? normaliseEndpoint(e.url) : null;
      if (eNorm !== normalised) continue;
      const checks = Array.isArray(e.checks) ? (e.checks as Json[]) : [];
      const parityCheck = checks.find((c) => String(c.id ?? "") === "x402.listing-parity");
      if (parityCheck) {
        const rawOutcome = String(parityCheck.outcome ?? "UNCHECKABLE");
        const parity =
          rawOutcome === "CONSISTENT"
            ? "CONSISTENT"
            : rawOutcome === "MISMATCH" || rawOutcome === "INCONSISTENT"
              ? "INCONSISTENT"
              : "UNCHECKABLE";
        const delta = rec(e.delta_since_previous);
        const drift =
          typeof delta?.["*"] === "string"
            ? String(delta["*"])
            : typeof delta?.["x402.listing-parity"] === "string"
              ? String(delta["x402.listing-parity"])
              : null;

        allObservations.push({
          as_of: parityCheck.as_of ?? indexRes.data.cut_at ?? null,
          adapter: "x402.listing-parity",
          parity,
          measurement_state: parityCheck.state ?? "MEASURED",
          diffs: Array.isArray(parityCheck.diffs) ? parityCheck.diffs : null,
          drift,
          payload_sha256: parityCheck.payload_sha256 ?? null,
          source_batch: `trust-index:${String(indexRes.data.edition ?? "latest")}`,
          ...(indexRes.data.draft_artifact === true ? { draft_artifact: true } : {}),
        });
      }
    }
  }

  if (!shardRes.ok && shardRes.status !== 404 && !indexRes.ok) {
    return {
      state: "UNREACHABLE",
      url: normalised,
      endpoint_key: endpointKey,
      reason: `neither capsule shard (${shardRes.error}) nor trust index (${indexRes.error}) could be reached; no cached state is substituted`,
      observations: [],
      sources,
      doctrine: DOCTRINE,
      not_a_certification: true,
    };
  }

  // Sort newest first by as_of
  allObservations.sort((a, b) => String(b.as_of ?? "").localeCompare(String(a.as_of ?? "")));

  const observations = includeHistory ? allObservations : allObservations.slice(0, 1);

  return {
    state: observations.length > 0 ? "MEASURED" : "NOT_MEASURED",
    url: normalised,
    requested_url: rawUrl,
    endpoint_key: endpointKey,
    history_included: includeHistory,
    total_observations_on_file: allObservations.length,
    observations,
    sources,
    doctrine: DOCTRINE,
    not_a_certification: true,
    note:
      observations.length > 0
        ? "Published contract-parity and surface-drift observations for this normalized URL. States only; never a certification."
        : "No published parity or drift observation is keyed to this normalized URL. NOT_MEASURED is declared, never zero and never a finding that the server is clean or broken.",
  };
}

export async function parityLookupToolResult(
  args: Record<string, unknown>,
  origin = "https://councilof.ai",
  fetchImpl: FetchLike = fetch,
): Promise<McpToolResult> {
  const payload = await parityLookupResult(
    origin,
    args as { url?: string; history?: boolean },
    fetchImpl,
  );
  const st = String(payload.state ?? "UNKNOWN");
  const summary =
    st === "BAD_ARGUMENTS"
      ? `BAD_ARGUMENTS — ${payload.reason}`
      : st === "UNREACHABLE"
        ? `UNREACHABLE — ${payload.reason}`
        : st === "MEASURED"
          ? `MEASURED — ${payload.observations && Array.isArray(payload.observations) ? payload.observations.length : 0} parity/drift observation(s) returned for ${payload.url}. States only.`
          : `NOT_MEASURED — no parity observation on file for ${payload.url}.`;
  return {
    content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(payload, null, 2)}` }],
    structuredContent: payload,
    isError: st === "BAD_ARGUMENTS",
  };
}

export const parity_lookup = {
  definition: {
    name: "parity_lookup",
    description:
      "Look up published contract-parity and tool-surface-drift history for one server URL: does the served tools/list match declared schemas, and has the tool surface changed since listing? Returns dated observations with diffs. Measurement, never certification.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "MCP server endpoint URL" },
        history: { type: "boolean", description: "include all dated observations (default: latest only)" },
      },
      required: ["url"],
    },
  },
  async handler(
    args: { url: string; history?: boolean },
    origin = "https://councilof.ai",
    fetchImpl: FetchLike = fetch,
  ) {
    return parityLookupResult(origin, args, fetchImpl);
  },
};
