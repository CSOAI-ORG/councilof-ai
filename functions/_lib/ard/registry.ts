/**
 * ARD registry over OUR inventory (Layer 0): GET /ard/v1/agents, GET /ard/v1/agents/<identifier>, POST /ard/v1/search,
 * POST /ard/v1/explore. Spec: Agentic Resource Discovery v0.91 (agenticresourcediscovery.org/spec, 26 Aug 2026), §5.3.
 * Mounted under /ard/v1 because councilof.ai does not use a bare /v1 prefix.
 *
 * INVENTORY, one list: (1) our own entries, read from /.well-known/ai-catalog.json; (2) every MCP server host our
 * contract-parity census catalogued (the /mcp-servers/ entity set, /reach/v1 index); (3) every A2A agent host our card
 * census catalogued (the /agent-cards/ set, signed HF record, signature-verified per request).
 *
 * BINDING RULE (lead, 30 Sep 2026): DISCOVERY LISTING state is kept apart from MEASUREMENT state. Every entry carries
 * metadata.listing = "LISTED" and metadata.measurement = MEASURED | UNMEASURED | WITHHELD_PENDING_CORRECTION.
 * Evidence fields (metadata "evidence.*", counts, signature states) and a trustManifest appear ONLY on a MEASURED entry,
 * and only from a signed record. An UNMEASURED entry is listed, nothing more. Nothing is re-measured here; every value
 * is copied from the records named in its evidence fields. The order is by identifier, never a ranking; a search
 * `score` is lexical text match only (see SCORE_BASIS) and says nothing about quality, safety or trust.
 */
import { type Ctx, SITE, fetchStaticJson } from "../reach/core";
import { listType } from "../reach/lists";
import { loadManifest } from "../reach/mcp";
import { loadA2A } from "../reach/agentCards";

export const ARD_SPEC = "ARD v0.91 (https://agenticresourcediscovery.org/spec/, 2026-08-26)";
export const BASE = "/ard/v1";
export const DEFAULT_PAGE = 20;
export const MAX_PAGE = 100;
export const SOURCE = "councilof.ai";
export const SCORE_BASIS =
  "score = lexical match of the query text against identifier, displayName, description and tags (0-100). It is not a quality, safety, trust or popularity score, and entries are never ranked by measurement.";
export const DOCTRINE = "Measurement, not certification. A listing is never adoption, endorsement or a grade.";
export const MEASUREMENT = ["MEASURED", "UNMEASURED", "WITHHELD_PENDING_CORRECTION"] as const;
/** Keys an entry may carry only when it is MEASURED (the fail-first test plants them on an UNMEASURED entry). */
export const EVIDENCE_KEY = /^(evidence\.|contract_parity\.|a2a\.signatures|trust)/;

export type Scalar = string | number | boolean | null;
export type ArdEntry = {
  identifier: string;
  displayName: string;
  type: string;
  url?: string;
  data?: Record<string, unknown>;
  description?: string;
  tags?: string[];
  representativeQueries?: string[];
  updatedAt?: string;
  trustManifest?: Record<string, unknown>;
  metadata: Record<string, Scalar>;
};

type Json = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

// ── inventory ────────────────────────────────────────────────────────────────────────────────

export async function ownEntries(ctx: Ctx): Promise<ArdEntry[]> {
  const cat = await fetchStaticJson<Json>(ctx, "/.well-known/ai-catalog.json", "AI Catalog");
  const out: ArdEntry[] = [];
  for (const e of (Array.isArray(cat.entries) ? cat.entries : []) as Json[]) {
    const id = str(e.identifier);
    const type = str(e.type);
    if (!id || !type) continue;
    const meas = (((e.extensions as Json) ?? {})["ai.councilof.measurement"] ?? {}) as Json;
    const measured = meas.state === "MEASURED";
    const entry: ArdEntry = {
      identifier: id,
      displayName: str(e.displayName) ?? id,
      type,
      ...(str(e.url) ? { url: e.url as string } : { data: (e.data ?? {}) as Json }),
      ...(str(e.description) ? { description: e.description as string } : {}),
      tags: Array.isArray(e.tags) ? (e.tags as unknown[]).map(String) : [],
      ...(Array.isArray(e.representativeQueries) ? { representativeQueries: (e.representativeQueries as unknown[]).map(String) } : {}),
      metadata: { listing: "LISTED", origin: "own", measurement: measured ? "MEASURED" : "UNMEASURED" },
    };
    if (measured) {
      if (str(meas.evidence)) entry.metadata["evidence.signed"] = meas.evidence as string;
      if (e.trustManifest && typeof e.trustManifest === "object") entry.trustManifest = e.trustManifest as Json;
    }
    out.push(entry);
  }
  return out;
}

export async function mcpEntries(ctx: Ctx): Promise<ArdEntry[]> {
  const [items, manifest] = await Promise.all([listType(ctx, "mcp-servers"), loadManifest(ctx)]);
  const cp = manifest.sources?.contract_parity ?? {};
  return items.map((i) => {
    const f = i.facets;
    const withheld = f.withheld === true;
    const compared = ["CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE"].reduce((a, k) => a + (typeof f[k] === "number" ? (f[k] as number) : 0), 0);
    const state = withheld ? "WITHHELD_PENDING_CORRECTION" : compared > 0 && cp.signature === "VERIFIES" ? "MEASURED" : "UNMEASURED";
    const md: Record<string, Scalar> = {
      listing: "LISTED",
      origin: "census",
      measurement: state,
      endpoints: typeof f.endpoints === "number" ? f.endpoints : null,
      own_estate: f.own_estate === true,
      page: i.loc,
    };
    if (state === "MEASURED") {
      for (const k of ["CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE"]) md[`contract_parity.${k}`] = (f[k] as number) ?? null;
      md["evidence.record"] = cp.record_url ?? null;
      md["evidence.signed"] = cp.signed_url ?? null;
      md["evidence.record_sha256"] = cp.record_sha256 ?? null;
      md["evidence.signature"] = cp.signature ?? null;
      md["evidence.as_of"] = cp.as_of ?? null;
    }
    return {
      identifier: `urn:air:councilof.ai:mcp-server:${i.key}`,
      displayName: i.key,
      type: "application/json",
      url: `${SITE}/mcp-servers/${i.key}/index.json`,
      description:
        state === "MEASURED"
          ? `MCP server host ${i.key}, catalogued by the Council of AI census. Its public statements (registry, cards, manifests) were compared with the live discovery boundary: contract parity per endpoint. Measurement only.`
          : state === "UNMEASURED"
            ? `MCP server host ${i.key}, catalogued by the Council of AI census. Listed, not measured: no comparison could be made.`
            : `MCP server host ${i.key}, catalogued by the Council of AI census. Findings withheld while a correction is pending.`,
      tags: ["mcp-server", "census", state.toLowerCase()],
      ...(i.lastmod ? { updatedAt: i.lastmod } : {}),
      metadata: md,
    };
  });
}

const A2A_READ = new Set(["VERIFIED", "FAILED", "NO_SIGNATURES"]);

export async function a2aEntries(ctx: Ctx): Promise<ArdEntry[]> {
  const d = await loadA2A(ctx);
  const items = await listType(ctx, "agent-cards");
  const verified = d.record.signature?.state === "VERIFIES" || d.record.signature?.state === "VALID";
  return items.map((i) => {
    const rows = d.byHost.get(i.key) ?? [];
    const r = rows[0];
    const withheld = i.facets.state === "WITHHELD";
    const state = withheld
      ? "WITHHELD_PENDING_CORRECTION"
      : verified && r && r.state === "CARD_SERVED" && A2A_READ.has(String(r.sig_state))
        ? "MEASURED"
        : "UNMEASURED";
    const md: Record<string, Scalar> = { listing: "LISTED", origin: "census", measurement: state, cards: rows.length, page: i.loc };
    if (state === "MEASURED") {
      md["a2a.card"] = r.state;
      md["a2a.signatures"] = r.sig_state ?? null;
      md["evidence.record"] = d.record.url;
      md["evidence.signed"] = d.record.signedUrl;
      md["evidence.record_sha256"] = d.record.sha256;
      md["evidence.signature"] = d.record.signature?.state ?? null;
      md["evidence.as_of"] = d.record.as_of;
    }
    return {
      identifier: `urn:air:councilof.ai:a2a-agent:${i.key}`,
      displayName: i.key,
      type: "application/json",
      url: `${SITE}/agent-cards/${i.key}/index.json`,
      description:
        state === "MEASURED"
          ? `A2A agent card listed for ${i.key}, catalogued by the Council of AI census: served card read and its signatures checked. Measurement only.`
          : state === "UNMEASURED"
            ? `A2A agent card listed for ${i.key}, catalogued by the Council of AI census. Listed, not measured.`
            : `A2A agent card listed for ${i.key}. Findings withheld while a correction is pending.`,
      tags: ["a2a-agent", "census", state.toLowerCase()],
      ...(d.record.as_of ? { updatedAt: d.record.as_of } : {}),
      metadata: md,
    };
  });
}

/** The whole inventory, sorted by identifier. A census source that cannot be read is reported, never guessed. */
export async function inventory(ctx: Ctx): Promise<{ entries: ArdEntry[]; sources: Record<string, string> }> {
  const sources: Record<string, string> = {};
  const parts = await Promise.all(
    ([["own", ownEntries], ["mcp_census", mcpEntries], ["a2a_census", a2aEntries]] as const).map(async ([k, f]) => {
      try {
        const e = await f(ctx);
        sources[k] = `LIVE (${e.length})`;
        return e;
      } catch (err) {
        sources[k] = `UNREACHABLE: ${String((err as Error)?.message ?? err).slice(0, 120)}`;
        return [] as ArdEntry[];
      }
    }),
  );
  const entries = parts.flat().sort((a, b) => (a.identifier < b.identifier ? -1 : a.identifier > b.identifier ? 1 : 0));
  return { entries, sources };
}

// ── doctrine gate ────────────────────────────────────────────────────────────────────────────

/** Throws if any entry mixes listing and measurement. Every response passes through it. */
export function checkEntries(entries: ArdEntry[]): ArdEntry[] {
  for (const e of entries) {
    const m = e.metadata?.measurement;
    if (e.metadata?.listing !== "LISTED" || !MEASUREMENT.includes(m as (typeof MEASUREMENT)[number]))
      throw new Error(`ARD entry ${e.identifier}: listing/measurement state missing`);
    if (m !== "MEASURED") {
      const bad = Object.keys(e.metadata).filter((k) => EVIDENCE_KEY.test(k));
      if (e.trustManifest || bad.length || "score" in e || "rating" in e)
        throw new Error(`ARD entry ${e.identifier}: ${m} entry carries evidence or trust fields (${[...bad, e.trustManifest ? "trustManifest" : ""].filter(Boolean).join(", ")})`);
    }
  }
  return entries;
}

// ── query: filter, search, pagination ────────────────────────────────────────────────────────

export type Filter = Record<string, string[]>;
const FILTER_FIELDS = new Set(["type", "tags", "identifier", "displayName", "measurement", "origin", "listing"]);

/** ARD §5.3 filter, the subset we answer: `field = "v"`, `field : "v"` (has), joined by AND. Unknown field -> error. */
export function parseFilterString(s: string | null): { filter: Filter; error: string | null } {
  const filter: Filter = {};
  if (!s || !s.trim()) return { filter, error: null };
  for (const part of s.split(/\s+AND\s+/i)) {
    const m = /^\s*([A-Za-z_.]+)\s*(=|:)\s*"([^"]*)"\s*$/.exec(part);
    if (!m) return { filter, error: `unsupported filter clause: ${part.trim().slice(0, 80)} (supported: field = "value" | field : "value", joined by AND)` };
    const f = m[1].replace(/^metadata\./, "");
    if (!FILTER_FIELDS.has(f)) return { filter, error: `unsupported filter field: ${m[1]}` };
    (filter[f] ??= []).push(m[3]);
  }
  return { filter, error: null };
}

/** POST /search filter: an object of field -> value | value[]. */
export function parseFilterObject(o: unknown): { filter: Filter; error: string | null } {
  const filter: Filter = {};
  if (o === undefined || o === null) return { filter, error: null };
  if (typeof o !== "object" || Array.isArray(o)) return { filter, error: "query.filter must be an object" };
  for (const [k0, v] of Object.entries(o as Json)) {
    const k = k0.replace(/^metadata\./, "");
    if (!FILTER_FIELDS.has(k)) return { filter, error: `unsupported filter field: ${k0}` };
    const vals = (Array.isArray(v) ? v : [v]).map(String);
    filter[k] = vals;
  }
  return { filter, error: null };
}

function fieldValues(e: ArdEntry, f: string): string[] {
  if (f === "tags") return e.tags ?? [];
  if (f === "measurement" || f === "origin" || f === "listing") return [String(e.metadata[f])];
  return [String((e as unknown as Json)[f] ?? "")];
}

export function applyFilter(entries: ArdEntry[], filter: Filter): ArdEntry[] {
  const keys = Object.keys(filter);
  if (!keys.length) return entries;
  return entries.filter((e) => keys.every((k) => filter[k].some((v) => fieldValues(e, k).includes(v))));
}

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);

/** Lexical text match, 0-100. Not a quality score (SCORE_BASIS). */
export function textScore(e: ArdEntry, text: string): number {
  const q = [...new Set(words(text))];
  if (!q.length) return 0;
  const hay = new Set(words([e.identifier, e.displayName, e.description ?? "", ...(e.tags ?? []), ...(e.representativeQueries ?? [])].join(" ")));
  const hits = q.filter((w) => hay.has(w)).length;
  return Math.round((100 * hits) / q.length);
}

export function encodeToken(offset: number): string {
  return btoa(`o:${offset}`).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
export function decodeToken(t: string | null): number | null {
  if (!t) return 0;
  try {
    const s = atob(t.replace(/-/g, "+").replace(/_/g, "/"));
    const m = /^o:(\d{1,7})$/.exec(s);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

export function pageSizeOf(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return DEFAULT_PAGE;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_PAGE) : null;
}
