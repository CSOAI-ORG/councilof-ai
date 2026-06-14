/**
 * CSOAI Client — councilof-ai Vertical Integration
 * Lightweight fetch-based wrapper (replaces @meok-labs/ai-sdk import to avoid
 * bundling Node/libp2p modules into the Next.js client bundle).
 */

const API_BASE = process.env.NEXT_PUBLIC_CSOAI_API_URL || 'https://api.csoai.org';

export interface ProtocolHealth {
  status: string;
  protocols?: {
    mcp?: { status: string };
    a2a?: { status: string; agents?: string[] };
    acp?: { status: string };
    p2p?: { status: string };
    abci?: { status: string; height?: number; entries?: number };
  };
}

/** Fetch protocol health */
export async function fetchProtocolHealth(): Promise<ProtocolHealth> {
  const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ProtocolHealth;
}

/** Ask the Policy Simulator Agent via A2A */
export async function askAgent(question: string): Promise<{ answer?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/a2a/councilofai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    throw new Error(`Agent request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as { answer?: string; error?: string };
}
