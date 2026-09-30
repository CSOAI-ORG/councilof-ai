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
 */
import { sha256Hex } from "./evidence";
import type { Candidate, CensusState } from "./types";

export const CENSUS_PATH = "/interop/effect-binding-census-index.json";
export const CENSUS_SCHEMA = "csoai.effect-binding.census-index/0.1";

export const OUTCOME_STATE: Record<string, CensusState> = { BINDS: "CONSISTENT", DOES_NOT_BIND: "DIVERGENT" };

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
  entries: Record<string, { outcome: string }>;
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
    o.schema === CENSUS_SCHEMA &&
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
  }
  return read;
}
