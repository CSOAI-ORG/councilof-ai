/**
 * MCP adapter for the free tool `index_edition` (functions/mcp/_index-edition.ts).
 *
 * Fetches a GSPC Trust Index edition (`/trust-index/edition-<date>.json` or
 * `/trust-index/latest.json`): per-subject check states for challenge correctness,
 * price stability, availability, and listing parity, with the edition Merkle root
 * and deltas vs. the previous edition.
 *
 * Honesty & Doctrine rules:
 * 1. States are dated observations — not scores, not rankings, not certification.
 * 2. If the edition carries `draft_artifact: true`, the response MUST carry
 *    `draft_artifact: true` and `draft_notes` verbatim — never stripped.
 */

import type { McpToolResult } from "./_trust-query";

export const INDEX_EDITION_TOOL_NAMES = new Set(["index_edition"]);

const DOCTRINE =
  "measurement, not certification — per-subject check states from a published GSPC Trust Index edition, never a score or grade";

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

export async function indexEditionResult(
  origin: string,
  args: { edition?: string; subject?: string; include_dropped?: boolean } = {},
  fetchImpl: FetchLike = fetch,
): Promise<Json> {
  const editionArg = cleanStr(args.edition) ?? "latest";
  if (!/^(latest|\d{4}-\d{2}-\d{2}(?:-v\d+\.\d+)?)$/i.test(editionArg)) {
    return {
      state: "BAD_ARGUMENTS",
      reason: `edition must be "latest" or an ISO date such as "2026-11-03" (received "${editionArg}")`,
      doctrine: DOCTRINE,
      not_a_certification: true,
    };
  }

  const subjectFilter = cleanStr(args.subject);
  const subjectHost = subjectFilter ? normaliseHostOrUrl(subjectFilter) : undefined;
  const subjectLower = subjectFilter?.toLowerCase();
  const includeDropped = args.include_dropped === true;

  const primaryUrl =
    editionArg === "latest"
      ? `${origin}/trust-index/latest.json`
      : `${origin}/trust-index/edition-${editionArg}.json`;

  let res = await fetchJson(primaryUrl, fetchImpl);
  if (!res.ok && editionArg === "latest") {
    res = await fetchJson(`${origin}/trust-index/edition-2026-11-03.json`, fetchImpl);
  }

  if (!res.ok) {
    return {
      state: res.status === 404 ? "NOT_PUBLISHED" : "UNREACHABLE",
      edition: editionArg,
      source: res.url,
      reason:
        res.status === 404
          ? `no Trust Index edition "${editionArg}" is published at ${res.url}`
          : `edition fetch failed (${res.error}); no cached edition is substituted`,
      doctrine: DOCTRINE,
      not_a_certification: true,
    };
  }

  const ed = res.data;
  const rawEntries = Array.isArray(ed.entries) ? (ed.entries as Json[]) : [];
  const filteredEntries = rawEntries.filter((entry) => {
    if (!includeDropped && entry.dropped === true) return false;
    if (!subjectLower || !subjectHost) return true;
    const subj = String(entry.subject ?? "").toLowerCase();
    const urlStr = String(entry.url ?? "").toLowerCase();
    return (
      subj === subjectHost ||
      subj.includes(subjectHost) ||
      urlStr === subjectLower ||
      urlStr.includes(subjectLower)
    );
  });

  const isDraft = ed.draft_artifact === true;

  return {
    state: subjectFilter && filteredEntries.length === 0 ? "EMPTY" : "PUBLISHED",
    source: res.url,
    index: ed.index ?? "gspc-trust-index",
    rail: ed.rail ?? "x402",
    edition: ed.edition ?? editionArg,
    cut_at: ed.cut_at ?? null,
    methodology_version: ed.methodology_version ?? null,
    stability_window_ms: ed.stability_window_ms ?? null,
    merkle_root: ed.merkle_root ?? null,
    merkle_rule: ed.merkle_rule ?? null,
    anchors: ed.anchors ?? null,
    ...(ed.anchors_note ? { anchors_note: ed.anchors_note } : {}),
    previous_edition: ed.previous_edition ?? null,
    coverage: ed.coverage ?? null,
    sample: ed.sample ?? null,
    // HONESTY RULE: forward draft_artifact and draft_notes verbatim whenever present
    draft_artifact: isDraft,
    ...(isDraft || Array.isArray(ed.draft_notes)
      ? { draft_notes: Array.isArray(ed.draft_notes) ? ed.draft_notes : [] }
      : {}),
    filters: {
      subject: subjectFilter ?? null,
      include_dropped: includeDropped,
    },
    entry_count: filteredEntries.length,
    entries: filteredEntries,
    doctrine: DOCTRINE,
    not_a_certification: true,
    free_verify: `${origin}/gspc-verify`,
  };
}

export async function indexEditionToolResult(
  args: Record<string, unknown>,
  origin = "https://councilof.ai",
  fetchImpl: FetchLike = fetch,
): Promise<McpToolResult> {
  const payload = await indexEditionResult(
    origin,
    args as { edition?: string; subject?: string; include_dropped?: boolean },
    fetchImpl,
  );
  const st = String(payload.state ?? "UNKNOWN");
  const summary =
    st === "BAD_ARGUMENTS"
      ? `BAD_ARGUMENTS — ${payload.reason}`
      : st === "UNREACHABLE" || st === "NOT_PUBLISHED"
        ? `${st} — ${payload.reason}`
        : `${st} — edition ${payload.edition} (${payload.entry_count} entries, merkle ${String(payload.merkle_root ?? "").slice(0, 16)}…${payload.draft_artifact ? ", draft_artifact=true" : ""}). Measurement, not certification.`;
  return {
    content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(payload, null, 2)}` }],
    structuredContent: payload,
    isError: st === "BAD_ARGUMENTS",
  };
}

export const index_edition = {
  definition: {
    name: "index_edition",
    description:
      "Fetch a GSPC Trust Index edition (x402 rail): per-subject check states for challenge correctness, price stability, availability, and listing parity, with the edition merkle root and deltas vs the previous edition. States are dated observations — not scores. Measurement, never certification.",
    inputSchema: {
      type: "object",
      properties: {
        edition: { type: "string", description: "ISO date (default: latest)" },
        subject: { type: "string", description: "filter to one host (optional)" },
        include_dropped: {
          type: "boolean",
          description: "include subjects dropped from the sample (default false)",
        },
      },
      required: [],
    },
  },
  async handler(
    args: { edition?: string; subject?: string; include_dropped?: boolean },
    origin = "https://councilof.ai",
    fetchImpl: FetchLike = fetch,
  ) {
    return indexEditionResult(origin, args, fetchImpl);
  },
};
