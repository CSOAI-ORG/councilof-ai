/**
 * Client-side fetcher for the meok-api substrate (port :3200) and the
 * meok-attestation-api (meok-attestation-api.vercel.app).
 *
 * All calls go through safe wrappers with timeouts and graceful fallbacks,
 * so if the substrate is offline the page still renders with last-known
 * values. Public read endpoints only — no signing, no key material.
 */

// Vite injects import.meta.env at build time. Defaults are production URLs.
const MEOK_API: string =
  (import.meta as any).env?.VITE_MEOK_API_URL || "https://meok-api.csoai.org";

const ATTESTATION_API: string =
  (import.meta as any).env?.VITE_ATTESTATION_API_URL ||
  "https://meok-attestation-api.vercel.app";

const TIMEOUT_MS = 5000;

async function fetchJSON<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

// ---------- Types -----------------------------------------------------------

export interface CouncilStatus {
  version: string;
  node_count: number;
  expertise_node_count: number;
  bridge_node_count: number;
  total_architecture_nodes: number;
  threshold: number;
  domains: string[];
  domain_count: number;
  nodes_by_domain: Record<string, any[]>;
}

export interface ExpertiseNetwork {
  total_expertise_nodes: number;
  active_nodes: number;
  total_rings: number;
  domain_stats: Record<string, any>;
  expertise_types: any[];
  domains: string[];
  version: string;
}

export interface BridgesTopology {
  bridges: any[];
  total: number;
  high_affinity_pairs: any[];
}

export interface AttestHealth {
  ok: boolean;
  version?: string;
  kid?: string;
  public_key?: string;
  identity?: string;
  alg?: string;
  live?: boolean;
}

export interface AuditEntry {
  id?: string;
  ts?: string;
  action?: string;
  cert_id?: string;
  principal?: string;
  prev_hash?: string;
  hash?: string;
}

export interface AuditResponse {
  entries?: AuditEntry[];
  events?: AuditEntry[];
  count?: number;
  live?: boolean;
  stats?: { backend?: string; total_events?: number };
}

export interface MemoryStats {
  episodes?: number;
  [k: string]: any;
}

// ---------- meok-api substrate ---------------------------------------------

export async function getCouncilStatus(): Promise<CouncilStatus | null> {
  return fetchJSON<CouncilStatus | null>(`${MEOK_API}/api/council/status`, null);
}

export async function getExpertiseNetwork(): Promise<ExpertiseNetwork | null> {
  return fetchJSON<ExpertiseNetwork | null>(`${MEOK_API}/api/expertise/network`, null);
}

export async function getBridgesTopology(): Promise<BridgesTopology | null> {
  return fetchJSON<BridgesTopology | null>(`${MEOK_API}/api/bridges/topology`, null);
}

export async function getHighAffinityBridges(): Promise<any[] | null> {
  return fetchJSON<any[] | null>(`${MEOK_API}/api/bridges/high-affinity`, null);
}

export async function getCouncilHistory(): Promise<any[] | null> {
  return fetchJSON<any[] | null>(`${MEOK_API}/api/council/history`, null);
}

export async function getMemoryStats(): Promise<MemoryStats | null> {
  return fetchJSON<MemoryStats | null>(`${MEOK_API}/api/memory/status`, null);
}

// ---------- meok-attestation-api spine -------------------------------------

export async function getAttestHealth(): Promise<AttestHealth | null> {
  // The live spine exposes /pubkey (Ed25519) — use it as the canonical
  // health source so we don't depend on a non-existent /v1/health.
  try {
    const r = await fetch(`${ATTESTATION_API}/pubkey`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      alg?: string;
      identity?: string;
      pubkey_hex?: string;
    };
    return {
      ok: true,
      version: "1.2.0",
      kid: j.identity ?? "v1",
      public_key: j.pubkey_hex,
      identity: j.identity,
      alg: j.alg,
      live: true,
    };
  } catch {
    return null;
  }
}

export async function getAuditLedger(limit = 8): Promise<AuditResponse | null> {
  return fetchJSON<AuditResponse | null>(
    `${ATTESTATION_API}/api/audit?limit=${limit}`,
    null,
  );
}

export const MEOK_API_BASE = MEOK_API;
export const ATTESTATION_API_BASE = ATTESTATION_API;
