/**
 * GSPC Route: pluggable DISCOVERY sources. A source lists catalogue entries; each routable entry becomes a
 * Candidate with source "directory". The one source today reads an ARD listing: the AGNTCY Directory gateway
 * (GET https://ai-catalog.outshift.io/v1/agents, envelope {results, nextPageToken, totalCount}) or any registry
 * that answers the ARD v0.91 list shape ({items, pageToken, total}), including our own /ard/v1/agents.
 *
 * Binding rule (lead, 30 Sep 2026): DISCOVERY LISTING state is kept apart from GSPC MEASUREMENT state. A listed
 * entry is "LISTED", nothing more. The directory's own trust / verification / scan / usage metadata is carried
 * verbatim as the directory's claim (declared_by the directory) and is read by NO rule: it never reaches the
 * Cedar entity (policy.ts cedarEntity), never sets census, never breaks a tie. A discovered candidate is
 * UNMEASURED until OUR signed census has it (census.ts, keyed by the normalised endpoint).
 */
import { SAFE_TOKEN, checkEndpoint } from "./candidates";
import { sha256Hex } from "./evidence";
import type { Candidate, CandidateKind, DirectoryRef } from "./types";
export type { DirectoryRef } from "./types";

export const DISCOVERY_SOURCES = ["ard"] as const;
export const MAX_DISCOVERED = 32;
export const MAX_PAGES = 5;
/** Listings the edge may be pointed at: fixed, never caller-supplied. */
export const ARD_LISTINGS: Record<string, string> = {
  agntcy: "https://ai-catalog.outshift.io/v1/agents",
  councilof: "https://councilof.ai/ard/v1/agents",
};

export type DiscoveryRead = {
  state: "LIVE" | "PARTIAL" | "UNREACHABLE" | "INVALID" | "NOT_REQUESTED";
  listing: string | null;
  pages_read: number;
  entries_read: number;
  candidates: number;
  skipped_not_routable: number;
  total_declared: number | null;
  truncated: boolean;
};

export type DiscoveryResult = { candidates: Candidate[]; read: DiscoveryRead; records: Record<string, unknown>[] };

export interface CandidateSource {
  id: string;
  listing: string;
  discover(max: number): Promise<DiscoveryResult>;
}

type Page = { entries: Record<string, unknown>[]; next: string | null; total: number | null };

/** Both list shapes: the AGNTCY gateway ({results, nextPageToken, totalCount}) and ARD v0.91 ({items, pageToken, total}). */
export function parseListPage(body: unknown): Page | null {
  const o = body as Record<string, unknown>;
  if (!o || typeof o !== "object") return null;
  const arr = Array.isArray(o.results) ? o.results : Array.isArray(o.items) ? o.items : null;
  if (!arr) return null;
  const tok = typeof o.nextPageToken === "string" ? o.nextPageToken : typeof o.pageToken === "string" ? o.pageToken : null;
  const total = typeof o.totalCount === "number" ? o.totalCount : typeof o.total === "number" ? o.total : null;
  return { entries: arr.filter((x) => x && typeof x === "object") as Record<string, unknown>[], next: tok ? tok : null, total };
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) out[k] = sortKeys((v as Record<string, unknown>)[k]);
    return out;
  }
  return v;
}

const KIND_BY_TYPE: Record<string, CandidateKind> = {
  "application/mcp-server-card+json": "mcp_tool",
  "application/a2a-agent-card+json": "a2a_agent",
};

/** The first remote endpoint a record declares for its kind, or null. Only declared data; nothing is probed. */
export function declaredEndpoint(entry: Record<string, unknown>, kind: CandidateKind): string | null {
  const data = (entry.data ?? {}) as Record<string, unknown>;
  const urls: unknown[] = [];
  if (kind === "mcp_tool") {
    const mcp = (data.mcp_data ?? {}) as Record<string, unknown>;
    for (const r of (Array.isArray(mcp.remotes) ? mcp.remotes : []) as Record<string, unknown>[]) urls.push(r?.url);
    for (const c of (Array.isArray(data.connections) ? data.connections : []) as Record<string, unknown>[])
      if (c && c.type !== "stdio") urls.push(c.url);
  } else if (kind === "a2a_agent") {
    const card = (data.card_data ?? data) as Record<string, unknown>;
    for (const i of (Array.isArray(card.supportedInterfaces) ? card.supportedInterfaces : []) as Record<string, unknown>[]) urls.push(i?.url);
    urls.push(card.url);
  }
  if (typeof entry.url === "string" && kind === "a2a_agent") urls.push(entry.url);
  const first = urls.find((u) => typeof u === "string" && u.length > 0);
  return typeof first === "string" ? first : null;
}

export async function entryToCandidate(entry: Record<string, unknown>, listing: string): Promise<{ candidate: Candidate; routable: boolean }> {
  const type = typeof entry.type === "string" ? entry.type : typeof entry.mediaType === "string" ? entry.mediaType : null;
  const kind = type ? KIND_BY_TYPE[type] : undefined;
  const identifier = typeof entry.identifier === "string" ? entry.identifier : "";
  const why: string[] = [];
  const id = `ard:${identifier}`;
  if (!SAFE_TOKEN.test(id)) why.push("directory identifier is not a safe token of at most 120 characters");
  const endpointRaw = kind ? declaredEndpoint(entry, kind) : null;
  let endpoint: string | null = null;
  let provider = "directory";
  if (!endpointRaw) why.push("the directory record declares no remote endpoint");
  else {
    const bad = checkEndpoint(endpointRaw);
    if (bad) why.push(`declared endpoint refused: ${bad}`);
    else {
      endpoint = endpointRaw;
      const h = new URL(endpointRaw).hostname.toLowerCase();
      if (SAFE_TOKEN.test(h)) provider = h;
    }
  }
  const meta = entry.metadata && typeof entry.metadata === "object" ? (entry.metadata as Record<string, unknown>) : null;
  const directory: DirectoryRef = {
    listing,
    identifier,
    display_name: typeof entry.displayName === "string" ? entry.displayName : null,
    type,
    record_sha256: await sha256Hex(JSON.stringify(sortKeys(entry))),
    listing_state: "LISTED",
    directory_claims: meta ? (sortKeys(meta) as Record<string, unknown>) : null,
    declared_by: "directory",
  };
  const candidate: Candidate = {
    id: SAFE_TOKEN.test(id) ? id : `ard:unsafe-${directory.record_sha256.slice(0, 16)}`,
    kind: kind ?? "mcp_tool",
    provider,
    model: null,
    region: "",
    endpoint,
    tool: null,
    local: false,
    // The narrow reading: a directory record does not declare read-only, so the candidate is not read-only.
    read_only: false,
    destructive: false,
    paid: false,
    data_class_allowed: ["public"],
    cost_declared: null,
    latency_declared_ms: null,
    source: "directory",
    census: { effect_binding: "UNMEASURED" },
    uncheckable: why,
    ignored_fields: [],
    directory,
  };
  return { candidate, routable: !!kind };
}

/** An ARD listing read page by page (polite: at most MAX_PAGES requests of page_size 100; skills and other non-routable kinds are counted and skipped). */
export function ardListingSource(listing: string, fetchJson: (url: string) => Promise<unknown>): CandidateSource {
  return {
    id: "ard",
    listing,
    async discover(max: number): Promise<DiscoveryResult> {
      const want = Math.max(1, Math.min(MAX_DISCOVERED, Math.floor(max)));
      const read: DiscoveryRead = { state: "LIVE", listing, pages_read: 0, entries_read: 0, candidates: 0, skipped_not_routable: 0, total_declared: null, truncated: false };
      const candidates: Candidate[] = [];
      const records: Record<string, unknown>[] = [];
      let token: string | null = null;
      for (let i = 0; i < MAX_PAGES && candidates.length < want; i++) {
        const u = new URL(listing);
        u.searchParams.set("page_size", "100");
        u.searchParams.set("pageSize", "100");
        if (token) {
          u.searchParams.set("page_token", token);
          u.searchParams.set("pageToken", token);
        }
        let body: unknown;
        try {
          body = await fetchJson(u.toString());
        } catch {
          read.state = read.pages_read ? "PARTIAL" : "UNREACHABLE";
          break;
        }
        const page = parseListPage(body);
        if (!page) {
          read.state = read.pages_read ? "PARTIAL" : "INVALID";
          break;
        }
        read.pages_read++;
        read.total_declared = page.total;
        for (const e of page.entries) {
          read.entries_read++;
          const { candidate, routable } = await entryToCandidate(e, listing);
          if (!routable) {
            read.skipped_not_routable++;
            continue;
          }
          if (candidates.length < want) {
            candidates.push(candidate);
            records.push(e);
          }
        }
        token = page.next;
        if (!token) break;
      }
      read.candidates = candidates.length;
      read.truncated = !!token || (read.total_declared !== null && read.entries_read < read.total_declared);
      return { candidates, read, records };
    },
  };
}

export const NOT_REQUESTED: DiscoveryRead = {
  state: "NOT_REQUESTED", listing: null, pages_read: 0, entries_read: 0, candidates: 0, skipped_not_routable: 0, total_declared: null, truncated: false,
};
