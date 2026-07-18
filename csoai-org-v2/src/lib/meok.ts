/**
 * Server-side fetcher for meok-api :3200.
 * The Next.js server fetches from the meok-api on each request.
 * In production this becomes an internal call; in Vercel it falls back
 * to the public csoai.org/meok-api mirror.
 */

const MEOK_API = process.env.MEOK_API_URL || "http://localhost:3200";

export interface CouncilStatus {
  version: string;
  node_count: number;
  expertise_node_count: number;
  bridge_node_count: number;
  total_architecture_nodes: number;
  threshold: number;
  domains: string[];
  domain_count: number;
  nodes_by_domain: Record<string, unknown[]>;
}

export interface ExpertiseNetwork {
  total_expertise_nodes: number;
  active_nodes: number;
  total_rings: number;
  domain_stats: Record<string, unknown>;
  expertise_types: unknown[];
  domains: string[];
  version: string;
}

export interface BridgesTopology {
  bridges: unknown[];
  total: number;
  high_affinity_pairs: unknown[];
}

export interface MemoryItem {
  id: string;
  content: string;
  care_weight: number;
  timestamp: string;
  source_agent?: string;
  tags?: string[];
}

async function fetchJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${MEOK_API}${path}`, {
      // Server-side: revalidate every 60s
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getCouncilStatus(): Promise<CouncilStatus | null> {
  return fetchJSON<CouncilStatus | null>("/api/council/status", null);
}

export async function getExpertiseNetwork(): Promise<ExpertiseNetwork | null> {
  return fetchJSON<ExpertiseNetwork | null>("/api/expertise/network", null);
}

export async function getBridgesTopology(): Promise<BridgesTopology | null> {
  return fetchJSON<BridgesTopology | null>("/api/bridges/topology", null);
}

export async function getCouncilHistory(): Promise<Record<string, unknown>[] | null> {
  return fetchJSON<Record<string, unknown>[] | null>("/api/council/history", null);
}

export async function getDreams(): Promise<Record<string, unknown>[] | null> {
  return fetchJSON<Record<string, unknown>[] | null>("/api/dreams", null);
}

export async function getMemoryStats(): Promise<Record<string, unknown> | null> {
  return fetchJSON<Record<string, unknown> | null>("/api/memory/status", null);
}

export async function searchMemory(q: string): Promise<MemoryItem[] | null> {
  return fetchJSON<MemoryItem[] | null>(
    `/api/memory/search?q=${encodeURIComponent(q)}`,
    null,
  );
}

export async function getExpertiseByDomain(
  domain: string,
): Promise<Record<string, unknown> | null> {
  return fetchJSON<Record<string, unknown> | null>(
    `/api/expertise/domain/${encodeURIComponent(domain)}`,
    null,
  );
}

export async function getHighAffinityBridges(): Promise<Record<string, unknown>[] | null> {
  return fetchJSON<Record<string, unknown>[] | null>("/api/bridges/high-affinity", null);
}
