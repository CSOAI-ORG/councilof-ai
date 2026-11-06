/**
 * MCP adapter for the free tool `trust_query` (functions/mcp/_trust-query.ts).
 *
 * Queries published trust telemetry (census snapshots at `/interop/x402-trust/latest.json`
 * and `/interop/mcp-trust/latest.json`, plus Trust Index editions at
 * `/trust-index/edition-<edition>.json`) filtered by rail, subject host/URL, and check id.
 *
 * Doctrine: measurement, never certification. States are dated observations from published
 * snapshots and editions, never verdicts, scores or grades. Zero matches return `matches: []`
 * with the coverage block and state `EMPTY` — never synthesized states.
 */

export type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError: boolean;
};

export const TRUST_QUERY_TOOL_NAMES = new Set(["trust_query"]);

const DOCTRINE =
  "measurement, not certification — dated observations from published census snapshots and Trust Index editions, never a verdict or grade";

type Json = Record<string, unknown>;
type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const rec = (v: unknown): Json | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;

function cleanStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function normaliseHostOrUrl(raw: string): string {
  const s = raw.trim().toLowerCase();
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    return u.hostname.toLowerCase();
  } catch {
    return s.replace(/^https?:\/\//, "").split("/")[0] || s;
  }
}

async function fetchJson(
  url: string,
  fetchImpl: FetchLike,
): Promise<{ ok: true; data: Json; url: string } | { ok: false; status: number; error: string; url: string }> {
  try {
    const res = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}`, url };
    }
    const parsed = rec(await res.json());
    if (!parsed) {
      return { ok: false, status: res.status, error: "invalid JSON object", url };
    }
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

export async function trustQueryResult(
  origin: string,
  args: { rail?: string; subject?: string; check?: string; edition?: string } = {},
  fetchImpl: FetchLike = fetch,
): Promise<Json> {
  const railArg = (cleanStr(args.rail) ?? "any").toLowerCase();
  if (railArg !== "x402" && railArg !== "mcp" && railArg !== "any") {
    return {
      state: "BAD_ARGUMENTS",
      reason: `rail must be one of "x402", "mcp", or "any" (received "${railArg}")`,
      doctrine: DOCTRINE,
      not_a_certification: true,
    };
  }

  const subjectFilter = cleanStr(args.subject);
  const subjectHost = subjectFilter ? normaliseHostOrUrl(subjectFilter) : undefined;
  const subjectLower = subjectFilter?.toLowerCase();
  const checkFilter = cleanStr(args.check)?.toLowerCase();
  const editionArg = cleanStr(args.edition) ?? "latest";

  if (!/^(latest|\d{4}-\d{2}-\d{2}(?:-v\d+\.\d+)?)$/i.test(editionArg)) {
    return {
      state: "BAD_ARGUMENTS",
      reason: `edition must be "latest" or an ISO date such as "2026-11-03" (received "${editionArg}")`,
      doctrine: DOCTRINE,
      not_a_certification: true,
    };
  }

  const snapshots: Record<string, unknown> = {};
  const sources: string[] = [];

  if (railArg === "x402" || railArg === "any") {
    const x402Snap = await fetchJson(`${origin}/interop/x402-trust/latest.json`, fetchImpl);
    sources.push(x402Snap.url);
    snapshots.x402 = x402Snap.ok
      ? {
          state: "PUBLISHED",
          source: x402Snap.url,
          as_of: x402Snap.data.as_of ?? null,
          counts: x402Snap.data.counts ?? null,
          headline: x402Snap.data.headline ?? null,
        }
      : {
          state: x402Snap.status === 404 ? "NOT_PUBLISHED" : "UNREACHABLE",
          source: x402Snap.url,
          reason: x402Snap.error,
        };
  }

  if (railArg === "mcp" || railArg === "any") {
    const mcpSnap = await fetchJson(`${origin}/interop/mcp-trust/latest.json`, fetchImpl);
    sources.push(mcpSnap.url);
    snapshots.mcp = mcpSnap.ok
      ? {
          state: "PUBLISHED",
          source: mcpSnap.url,
          as_of: mcpSnap.data.as_of ?? null,
          partial: mcpSnap.data.partial ?? null,
          enumeration: mcpSnap.data.enumeration ?? null,
          counts: mcpSnap.data.counts ?? null,
          headline: mcpSnap.data.headline ?? null,
        }
      : {
          state: mcpSnap.status === 404 ? "NOT_PUBLISHED" : "UNREACHABLE",
          source: mcpSnap.url,
          reason: mcpSnap.error,
        };
  }

  // Load Trust Index edition for per-subject check rows when x402 or any rail is requested
  const editionPath =
    editionArg === "latest"
      ? `${origin}/trust-index/latest.json`
      : `${origin}/trust-index/edition-${editionArg}.json`;

  let editionRes = await fetchJson(editionPath, fetchImpl);
  if (!editionRes.ok && editionArg === "latest") {
    // Fallback to dated edition if /trust-index/latest.json is not yet aliased
    editionRes = await fetchJson(`${origin}/trust-index/edition-2026-11-03.json`, fetchImpl);
  }
  sources.push(editionRes.url);

  const matches: Array<Record<string, unknown>> = [];
  let editionMeta: Record<string, unknown> | null = null;

  if (editionRes.ok) {
    const ed = editionRes.data;
    const edRail = String(ed.rail ?? "x402").toLowerCase();
    editionMeta = {
      source: editionRes.url,
      edition: ed.edition ?? editionArg,
      rail: edRail,
      cut_at: ed.cut_at ?? null,
      methodology_version: ed.methodology_version ?? null,
      merkle_root: ed.merkle_root ?? null,
      coverage: ed.coverage ?? null,
      ...(ed.draft_artifact === true
        ? {
            draft_artifact: true,
            draft_notes: Array.isArray(ed.draft_notes) ? ed.draft_notes : [],
          }
        : {}),
    };

    if (railArg === "any" || railArg === edRail) {
      const entries = Array.isArray(ed.entries) ? (ed.entries as Json[]) : [];
      for (const entry of entries) {
        const subj = String(entry.subject ?? "").toLowerCase();
        const urlStr = String(entry.url ?? "").toLowerCase();
        if (subjectLower && subjectHost) {
          const hostMatch = subj === subjectHost || subj.includes(subjectHost);
          const urlMatch = urlStr === subjectLower || urlStr.includes(subjectLower);
          if (!hostMatch && !urlMatch) continue;
        }
        const rawChecks = Array.isArray(entry.checks) ? (entry.checks as Json[]) : [];
        const filteredChecks = checkFilter
          ? rawChecks.filter((c) => String(c.id ?? "").toLowerCase() === checkFilter)
          : rawChecks;
        if (checkFilter && filteredChecks.length === 0) continue;

        matches.push({
          subject: entry.subject ?? null,
          url: entry.url ?? null,
          rail: edRail,
          declared: entry.declared ?? null,
          checks: filteredChecks.map((c) => ({
            id: c.id ?? null,
            state: c.state ?? "UNMEASURED",
            outcome: c.outcome ?? (c.stable !== undefined ? (c.stable ? "STABLE" : "CHANGED") : null),
            as_of: c.as_of ?? ed.cut_at ?? null,
            payload_sha256: c.payload_sha256 ?? null,
            card_sha256: c.card_sha256 ?? null,
          })),
          delta_since_previous: entry.delta_since_previous ?? null,
          verify: entry.verify ?? `${origin}/gspc-verify`,
        });
      }
    }
  } else {
    editionMeta = {
      state: editionRes.status === 404 ? "NOT_PUBLISHED" : "UNREACHABLE",
      source: editionRes.url,
      edition: editionArg,
      reason: editionRes.error,
    };
  }

  const anySnapshotReachable =
    Object.values(snapshots).some((s) => rec(s)?.state === "PUBLISHED") || editionRes.ok;

  if (!anySnapshotReachable) {
    return {
      state: "UNREACHABLE",
      rail: railArg,
      reason: "neither the census snapshots nor the requested Trust Index edition could be reached; no cached state is substituted",
      sources,
      doctrine: DOCTRINE,
      not_a_certification: true,
    };
  }

  const state = matches.length > 0 ? "MEASURED" : subjectFilter || checkFilter ? "EMPTY" : "PUBLISHED";

  return {
    state,
    as_of:
      (editionRes.ok ? (editionRes.data.cut_at as string | undefined) : undefined) ??
      (rec(snapshots.x402)?.as_of as string | undefined) ??
      (rec(snapshots.mcp)?.as_of as string | undefined) ??
      null,
    rail: railArg,
    filters: {
      subject: subjectFilter ?? null,
      check: checkFilter ?? null,
      edition: editionArg,
    },
    match_count: matches.length,
    matches,
    snapshots,
    edition: editionMeta,
    ...(editionRes.ok && editionRes.data.draft_artifact === true
      ? {
          draft_artifact: true,
          draft_notes: Array.isArray(editionRes.data.draft_notes) ? editionRes.data.draft_notes : [],
        }
      : {}),
    sources,
    doctrine: DOCTRINE,
    not_a_certification: true,
    note:
      matches.length > 0
        ? "Filtered observations from published Trust Index and census records. States only; never a certification, score or grade."
        : "Zero matching per-subject rows in the requested edition. Empty is empty (NOT_MEASURED in this sample, never a fail); aggregate census snapshot counts are included in `snapshots`.",
  };
}

export async function trustQueryToolResult(
  args: Record<string, unknown>,
  origin = "https://councilof.ai",
  fetchImpl: FetchLike = fetch,
): Promise<McpToolResult> {
  const payload = await trustQueryResult(
    origin,
    args as { rail?: string; subject?: string; check?: string; edition?: string },
    fetchImpl,
  );
  const st = String(payload.state ?? "UNKNOWN");
  const summary =
    st === "BAD_ARGUMENTS"
      ? `BAD_ARGUMENTS — ${payload.reason}`
      : st === "UNREACHABLE"
        ? `UNREACHABLE — ${payload.reason}`
        : `${st} — rail=${payload.rail}, matches=${payload.match_count ?? 0}${payload.draft_artifact ? " (draft edition)" : ""}. Measurement, not certification.`;
  return {
    content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(payload, null, 2)}` }],
    structuredContent: payload,
    isError: st === "BAD_ARGUMENTS",
  };
}

export const trust_query = {
  definition: {
    name: "trust_query",
    description:
      "Query published trust telemetry (census snapshots, Trust Index editions) filtered by rail, subject host, and check. Returns dated MEASURED/UNMEASURED states with sources. Measurement, never certification — states are observations, not verdicts.",
    inputSchema: {
      type: "object",
      properties: {
        rail: { type: "string", enum: ["x402", "mcp", "any"] },
        subject: { type: "string", description: "hostname or endpoint URL to filter on (optional)" },
        check: { type: "string", description: "e.g. x402.challenge-correctness, mcp.contract-parity (optional)" },
        edition: { type: "string", description: "ISO date of a Trust Index edition (default: latest)" },
      },
      required: [],
    },
  },
  async handler(
    args: { rail?: string; subject?: string; check?: string; edition?: string },
    origin = "https://councilof.ai",
    fetchImpl: FetchLike = fetch,
  ) {
    return trustQueryResult(origin, args, fetchImpl);
  },
};
