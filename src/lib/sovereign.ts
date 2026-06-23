/**
 * Sovereign Town bridge — the trust-minimized half of CSOAI's moat.
 *
 * Reads the PUBLIC attestation export that Sovereign Town mirrors to the
 * proofof-site Vercel project. This is the only Sovereign Town surface
 * reachable from a deployed (Vercel) front-end — the live `:3940` API binds
 * 127.0.0.1 and is intentionally local-only.
 *
 * HONESTY NOTE — what is and isn't verifiable here:
 *   - The snapshot files (status.json / fleet_status_*.json) are self-published
 *     and carry NO signature, only a `chain_head`. Treat the numbers as an
 *     attested-source readout, NOT as cryptographically proven.
 *   - The genuinely Ed25519-signed artifacts (the flywheel ledger head + the
 *     Bitcoin anchor pointer) are what <SovereignVerifier/> checks client-side
 *     against the issuer pubkey below — no server, no account, no trust in the
 *     snapshot numbers above.
 *
 * Source of truth for the signing scheme: clawd/sovereign-town/p0_aqua/flywheel_forever.py
 * (spaced json.dumps(sort_keys=True) + prev-prefixed message — see [[sov-ledger-signing-scheme]]).
 * NOTE: the older verify/index.html uses compact JSON without prev and is WRONG.
 */

// proofof.ai itself 404s on these artifacts; the live mirror is the
// proofof-site Vercel project. Override with SOV_EXPORT_BASE if a canonical
// csoai.org mirror is stood up later.
export const SOV_EXPORT_BASE =
  process.env.SOV_EXPORT_BASE ?? 'https://proofof-site.vercel.app/sovereign-town';

/** Ed25519 issuer public key (base64). Published in the export + DID registry. */
export const SOV_ISSUER_PUBKEY = '53kc24fqQz4MctZwtH+SuPLEKdX+NLlhK5wALr5H188=';

export interface SovHost {
  host: string;
  cycle: number;
  cum_episodes: number;
  ungoverned_crimes: number;
  chain_head: string;
  updated: string;
}

export interface SovStatus {
  cum_episodes: number;
  governed_crimes: number;
  ungoverned_crimes: number;
  hives: number;
  personas: number;
  passports: number;
  hosts: SovHost[];
  issuer_pubkey: string;
  verify_url: string;
  updated: string;
  published_at: string;
}

export interface SovModel {
  hive: string;
  episodes: number;
  test_acc: number;
  f1: number;
  model: string;
}

export interface SovMoat {
  hives: number;
  models: Record<string, SovModel>;
}

/** Public signed ledger head (ledger_head.json) — the artifact that closes the
 *  self-attestation gap: real Ed25519-signed, genesis-chained flywheel entries
 *  a browser verifies client-side. */
export interface SovLedgerHead {
  schema: string;
  issuer_pubkey: string;
  n_entries: number;
  of_total: number;
  host?: string;
  scope: string;
  verify_url?: string;
  how_to_verify?: string;
  entries: Record<string, any>[];
}

/** Bitcoin-anchored full-ledger pointer (anchor.json) — makes the signed ledger
 *  externally anchored, not just self-signed. */
export interface SovAnchor {
  ledger: string;
  label?: string;
  merkle_root: string;
  n_attestable: number;
  n_total?: number;
  full_ledger_sha256?: string;
  ts_first?: string;
  ts_last?: string;
  bitcoin: {
    confirmed: boolean;
    blocks: { height: number; merkle_root: string | null }[];
    note: string;
  };
  anchor_manifest: string;
  verify_cmd: string;
  issuer_pubkey: string;
  scope: string;
}

/** Derived, honesty-filtered model stats. A model with f1 === 0 is a degenerate
 *  single-class predictor (predicts the majority class) and is NOT a working
 *  threat model — surfaced separately rather than inflating the count. */
export interface ModelQuality {
  total: number;
  working: number;
  degenerate: number;
  degenerateHives: string[];
  medianF1: number | null;
  medianAcc: number | null;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SOV_EXPORT_BASE}/${path}`, {
      // Re-fetch at most every 5 min; the VM publishes on cycle boundaries.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getSovStatus = () => getJson<SovStatus>('status.json');
export const getSovMoat = () => getJson<SovMoat>('moat_models.json');

export function assessModels(moat: SovMoat | null): ModelQuality | null {
  if (!moat?.models) return null;
  const entries = Object.entries(moat.models);
  const working = entries.filter(([, m]) => (m.f1 ?? 0) > 0);
  const degenerate = entries.filter(([, m]) => (m.f1 ?? 0) === 0);
  const median = (xs: number[]) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  return {
    total: entries.length,
    working: working.length,
    degenerate: degenerate.length,
    degenerateHives: degenerate.map(([k]) => k),
    medianF1: median(working.map(([, m]) => m.f1)),
    medianAcc: median(working.map(([, m]) => m.test_acc)),
  };
}

/** Format a large count compactly (1_440_270_720 -> "1.44B"). */
export function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}