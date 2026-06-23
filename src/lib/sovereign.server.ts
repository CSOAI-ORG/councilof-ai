import 'server-only';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  SOV_EXPORT_BASE,
  type SovStatus,
  type SovMoat,
  type SovLedgerHead,
  type SovAnchor,
  type ModelQuality,
  assessModels,
} from './sovereign';

/**
 * Server-only Sovereign Town reader. Tries a LOCAL generated export first
 * (the signed artifacts bundled in public/sov-export/), then falls back to the
 * public proofof-site mirror. Local-first means the /sovereign-town and /verify
 * pages prerender with real signed-ledger data even if the remote mirror is
 * briefly unreachable, and the client verifier is fed genuine entries.
 *
 * Local dir resolution order:
 *   1. process.env.SOV_LOCAL_DIR (absolute)  — explicit override
 *   2. <repo>/public/sov-export             — where the bundled artifacts live
 */

function localDir(): string | null {
  if (process.env.SOV_LOCAL_DIR && existsSync(process.env.SOV_LOCAL_DIR)) return process.env.SOV_LOCAL_DIR;
  const p = resolve(process.cwd(), 'public/sov-export');
  return existsSync(p) ? p : null;
}

function readLocal<T>(name: string): T | null {
  const dir = localDir();
  if (!dir) return null;
  const path = join(dir, name);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

async function fetchRemote<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SOV_EXPORT_BASE}/${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Status: local-first, remote-fallback. */
export async function getSovStatusServer(): Promise<SovStatus | null> {
  const local = readLocal<SovStatus>('status.json');
  if (local && !(local as any)?.error) return local;
  return fetchRemote<SovStatus>('status.json');
}

export async function getSovMoatServer(): Promise<SovMoat | null> {
  const local = readLocal<SovMoat>('moat_models.json');
  if (local && !(local as any)?.error) return local;
  return fetchRemote<SovMoat>('moat_models.json');
}

/** Public signed ledger head (real Ed25519-signed, genesis-chained entries).
 *  Local-first (public/sov-export/ledger_head.json), remote-fallback. */
export async function getSovLedgerHeadServer(): Promise<SovLedgerHead | null> {
  const local = readLocal<SovLedgerHead>('ledger_head.json');
  if (local && !(local as any)?.error && Array.isArray(local.entries)) return local;
  return fetchRemote<SovLedgerHead>('ledger_head.json');
}

/** Bitcoin-anchored full-ledger pointer (externally anchors the signed ledger). */
export async function getSovAnchorServer(): Promise<SovAnchor | null> {
  const local = readLocal<SovAnchor>('anchor.json');
  if (local && !(local as any)?.error) return local;
  return fetchRemote<SovAnchor>('anchor.json');
}

export { assessModels, type ModelQuality };