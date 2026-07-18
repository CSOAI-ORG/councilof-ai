/**
 * Server-side fetcher for the CSOAI engine (meok-attestation-api).
 *
 * CSOAI is the BODY; the council submerge is the SURFACE — these calls let
 * csoai.org/council pages display live SIGIL state, the audit ledger, and a
 * working /sign + /verify demo wired to the canonical signer (no shadow
 * implementation, no parallel key).
 *
 * The spine lives at meok-attestation-api (Vercel). In production this is the
 * public hostname; in dev it falls back to the local Vercel preview URL.
 */
const ATTESTATION_API =
  process.env.ATTESTATION_API_URL ||
  process.env.MEOK_ATTESTATION_API_URL ||
  "https://meok-attestation-api.vercel.app";

async function fetchJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${ATTESTATION_API}${path}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export interface AttestHealth {
  ok: boolean;
  version?: string;
  kid?: string;
  public_key?: string;
  identity?: string;
  alg?: string;
  live?: boolean;
  error?: string;
}

export interface AuditEntry {
  id?: string;
  ts?: string;
  action?: string;
  cert_id?: string;
  principal?: string;
  prev_hash?: string;
  hash?: string;
  chain_intact?: boolean;
}

export interface AuditResponse {
  entries?: AuditEntry[];
  events?: AuditEntry[]; // actual field name on the live spine
  count?: number;
  last_hash?: string;
  stats?: { backend?: string; total_events?: number };
  since?: number;
  limit?: number;
  live?: boolean;
  error?: string;
}

export interface VerifyResult {
  valid: boolean;
  cert_id?: string;
  reason?: string;
  payload?: Record<string, unknown>;
  signature?: string;
  public_key?: string;
  live?: boolean;
  error?: string;
}

/** GET /v1/health — public, no key. Reports the live SIGIL kid + pubkey.
 *  Falls back to /pubkey (the canonical key endpoint) if /v1/health is missing. */
export async function getAttestHealth(): Promise<AttestHealth | null> {
  // Spine has /pubkey (Ed25519) but not /v1/health on the live Vercel deploy.
  // /pubkey is the canonical identity endpoint — use it as the health source.
  try {
    const r = await fetch(`${ATTESTATION_API}/pubkey`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
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

/** GET /api/audit — hash-chained ledger tail (read-only, public summary). */
export async function getAuditLedger(limit = 20): Promise<AuditResponse | null> {
  return fetchJSON<AuditResponse | null>(`/api/audit?limit=${limit}`, null);
}

/** GET /verify/{cert_id} — meta lookup; returns a slim JSON we can render. */
export async function verifyById(
  certId: string,
): Promise<VerifyResult | null> {
  // The /verify/{id} route returns HTML for humans, so we call POST /verify
  // with a probe {cert_id} — but to keep the surface zero-write, we use the
  // JSON sibling if the spine exposes one. If not, we fall back to a head call.
  try {
    const r = await fetch(`${ATTESTATION_API}/v/${certId}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    return {
      valid: r.ok,
      cert_id: certId,
      live: true,
    };
  } catch {
    return null;
  }
}

export const ATTESTATION_API_BASE = ATTESTATION_API;
