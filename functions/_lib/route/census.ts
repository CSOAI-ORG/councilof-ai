/**
 * GSPC Route: the effect-binding census lookup that feeds the floor rule floor:effect-binding-divergent.
 *
 * Source: /interop/effect-binding-census-index.json, built by scripts/effect-binding/eb_census_index.py from
 * the latest SIGNED effect-binding server-probe run (artifact sha256 and signed payload sha256 are carried in
 * the index and copied into every route record). Entries are keyed by sha256 of the normalised endpoint URL,
 * so no third-party name or URL is served from this site.
 *
 * Mapping (the same one the quality feed uses): BINDS -> CONSISTENT, DOES_NOT_BIND -> DIVERGENT. Every other
 * outcome (PARTIAL, UNCHECKABLE, UNREACHABLE, NO_TOOLS, NO_READONLY_TOOL), an endpoint the run did not probe,
 * a candidate with no public https endpoint, and an unreadable index are all UNMEASURED: the floor can only
 * forbid on a divergence that was observed and signed, never on an absence.
 *
 * PER TOOL (index schema 0.2). A candidate that names a tool is looked up a second time, by sha256 of the tool
 * name, in its endpoint's `tools` rows. The owner ruling of 2026-09-30 ("verified read-only"):
 *   - census.tool.listed_read_only is true only if the signed probe listed the tool in read_only_tools; only
 *     such a tool (or a first-party tool annotated readOnlyHint) is ever executed server-side (execute.ts);
 *   - the tool's own P2 result decides effect_binding when it is decisive: ACCEPTS_SILENTLY (the extra argument
 *     was silently accepted) is DIVERGENT and the floor refuses it unless the caller's policy sets
 *     allow_divergent_effect_binding; REJECTS is CONSISTENT and allowed;
 *   - an INDETERMINATE or NOT_PROBED tool keeps the server-level state (a DOES_NOT_BIND server stays DIVERGENT).
 */
import { sha256Hex } from "./evidence";
import type { Candidate, CensusState, ToolCensus } from "./types";

export const CENSUS_PATH = "/interop/effect-binding-census-index.json";
export const CENSUS_SCHEMA = "csoai.effect-binding.census-index/0.2";
/** Schema 0.1 (no per-tool rows) is still read: every tool is then listed_read_only null, never true. */
export const CENSUS_SCHEMAS = ["csoai.effect-binding.census-index/0.1", CENSUS_SCHEMA];

export const OUTCOME_STATE: Record<string, CensusState> = { BINDS: "CONSISTENT", DOES_NOT_BIND: "DIVERGENT" };
export const TOOL_P2_STATE: Record<string, CensusState> = { REJECTS: "CONSISTENT", ACCEPTS_SILENTLY: "DIVERGENT" };
const TOOL_P2 = new Set(["REJECTS", "ACCEPTS_SILENTLY", "INDETERMINATE", "NOT_PROBED"]);

export type CensusRead = {
  state: "LIVE" | "UNREACHABLE" | "INVALID" | "NOT_WIRED";
  source: string | null;
  run_as_of: string | null;
  artifact_sha256: string | null;
  signed_payload_sha256: string | null;
  looked_up: number;
  matched: number;
};

type Index = {
  schema: string;
  source: { artifact_sha256: string; signed_payload_sha256: string; as_of: string; artifact: string };
  entries: Record<string, { outcome: string; tools?: Record<string, { p2?: string }> }>;
};

/**
 * scheme://host[:non-default-port]/path with the host lower-cased, the query, fragment and credentials dropped
 * and trailing slashes removed. eb_census_index.py applies the same rule (test vectors in route.test.ts and
 * scripts/effect-binding/test_eb_census_index.py). null for anything that is not a public https URL.
 */
export function normaliseEndpointUrl(endpoint: string | null): string | null {
  if (!endpoint || endpoint.startsWith("local:")) return null;
  let u: URL;
  try {
    u = new URL(endpoint);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const port = u.port && !((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) ? `:${u.port}` : "";
  return `${u.protocol}//${u.hostname.toLowerCase()}${port}${u.pathname.replace(/\/+$/, "")}`;
}

function validIndex(x: unknown): x is Index {
  const o = x as Index;
  return (
    !!o &&
    CENSUS_SCHEMAS.includes(o.schema) &&
    !!o.source &&
    /^[0-9a-f]{64}$/.test(String(o.source.artifact_sha256)) &&
    /^[0-9a-f]{64}$/.test(String(o.source.signed_payload_sha256)) &&
    !!o.entries &&
    typeof o.entries === "object"
  );
}

/**
 * Sets candidate.census for every candidate, in place. Never throws: an unreadable or malformed index leaves
 * every candidate UNMEASURED with the reason, and the read state goes into the record.
 */
export async function applyCensus(candidates: Candidate[], fetchCensus?: () => Promise<unknown>): Promise<CensusRead> {
  const read: CensusRead = {
    state: "NOT_WIRED",
    source: null,
    run_as_of: null,
    artifact_sha256: null,
    signed_payload_sha256: null,
    looked_up: 0,
    matched: 0,
  };
  if (!fetchCensus) return read;
  read.source = CENSUS_PATH;
  let idx: unknown;
  try {
    idx = await fetchCensus();
  } catch {
    read.state = "UNREACHABLE";
  }
  if (read.state !== "UNREACHABLE" && !validIndex(idx)) read.state = "INVALID";
  if (read.state === "UNREACHABLE" || read.state === "INVALID") {
    for (const c of candidates) c.census = { effect_binding: "UNMEASURED", outcome: null, basis: `census_${read.state.toLowerCase()}` };
    return read;
  }
  const index = idx as Index;
  read.state = "LIVE";
  read.run_as_of = index.source.as_of ?? null;
  read.artifact_sha256 = index.source.artifact_sha256;
  read.signed_payload_sha256 = index.source.signed_payload_sha256;
  for (const c of candidates) {
    const norm = normaliseEndpointUrl(c.endpoint);
    if (!norm) {
      c.census = { effect_binding: "UNMEASURED", outcome: null, basis: "no_public_endpoint" };
      continue;
    }
    read.looked_up++;
    const hit = index.entries[await sha256Hex(norm)];
    if (!hit || typeof hit.outcome !== "string") {
      c.census = { effect_binding: "UNMEASURED", outcome: null, basis: "not_in_census" };
      continue;
    }
    read.matched++;
    c.census = { effect_binding: OUTCOME_STATE[hit.outcome] ?? "UNMEASURED", outcome: hit.outcome, basis: "census" };
    if (c.tool !== null) {
      const tool = await toolRow(hit, c.tool);
      c.census.tool = tool;
      const s = tool.p2 ? TOOL_P2_STATE[tool.p2] : undefined;
      if (s) c.census = { ...c.census, effect_binding: s, basis: "census_tool" };
    }
  }
  return read;
}

/** The per-tool row for one tool at one census entry. No row => the probe did not list it read-only. */
async function toolRow(hit: Index["entries"][string], tool: string): Promise<ToolCensus> {
  if (!hit.tools || typeof hit.tools !== "object") return { listed_read_only: null, p2: null };
  const row = hit.tools[await sha256Hex(tool)];
  if (!row) return { listed_read_only: false, p2: null };
  const p2 = typeof row.p2 === "string" && TOOL_P2.has(row.p2) ? (row.p2 as ToolCensus["p2"]) : "INDETERMINATE";
  return { listed_read_only: true, p2 };
}
