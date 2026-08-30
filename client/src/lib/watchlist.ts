/**
 * Vendor watchlist — local digest compare, not a Council notification service.
 *
 * Paste Hub ids. Remember the last sha256 we saw. When it moves, say so.
 * Never stamps MEASURED. Never downloads weights.
 */

export const WATCHLIST_KEY = "csoai.watchlist/1";
export const WATCHLIST_CAP = 50;

export type WatchRow = {
  id: string;
  added: string;
  last_sha256: string | null;
  last_checked: string | null;
  digest_moved: boolean;
};

export const WATCHLIST_RULING =
  "A local sha256 compare. DISCOVERED only. Not MEASURED. Not a push alert.";

export function emptyWatchlist(): WatchRow[] {
  return [];
}

export function parseWatchIds(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?\/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(s));
}

export function upsertWatch(list: WatchRow[], ids: string[], now = new Date().toISOString()): WatchRow[] {
  const next = [...list];
  for (const id of ids) {
    if (next.some((r) => r.id === id)) continue;
    if (next.length >= WATCHLIST_CAP) break;
    next.push({ id, added: now, last_sha256: null, last_checked: null, digest_moved: false });
  }
  return next;
}

export function dropWatch(list: WatchRow[], id: string): WatchRow[] {
  return list.filter((r) => r.id !== id);
}

/** First LFS sha256 on the repo, if the Hub payload carries siblings. */
export function digestFromHubModel(j: unknown): string | null {
  const siblings = (j as { siblings?: Array<{ lfs?: { sha256?: string } }> })?.siblings;
  if (!Array.isArray(siblings)) return null;
  for (const s of siblings) {
    const sha = s?.lfs?.sha256;
    if (typeof sha === "string" && /^[a-f0-9]{64}$/i.test(sha)) return sha.toLowerCase();
  }
  return null;
}

export function applyDigest(row: WatchRow, sha: string | null, now = new Date().toISOString()): WatchRow {
  const moved = Boolean(row.last_sha256 && sha && row.last_sha256 !== sha);
  return {
    ...row,
    last_sha256: sha ?? row.last_sha256,
    last_checked: now,
    digest_moved: moved,
  };
}

export function loadWatchlist(storage: Pick<Storage, "getItem"> | null): WatchRow[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as { rows?: WatchRow[] };
    return Array.isArray(j?.rows) ? j.rows.filter((r) => typeof r?.id === "string") : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(storage: Pick<Storage, "setItem"> | null, rows: WatchRow[]): void {
  if (!storage) return;
  storage.setItem(WATCHLIST_KEY, JSON.stringify({ schema: WATCHLIST_KEY, rows }));
}
