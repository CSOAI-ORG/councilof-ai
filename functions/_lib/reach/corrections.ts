/**
 * Pending corrections, as the entity pages see them.
 *
 * DOCTRINE: never show a finding that has a pending correction. The ledger (functions/api/corrections.ts,
 * the same object /api/corrections serves) is the only source; nothing here is typed.
 *
 * PENDING means the ledger's own status says the correction is not finished: pending, staged,
 * awaiting, open, unverified, under review. An entry whose status is final (CORRECTED, RECORDED,
 * WITHDRAWN, RECONCILED) is history, not a hold.
 *
 * MATCHING is deliberately conservative — it over-matches rather than under-matches, because the
 * cost of a false match is a finding shown one day later, and the cost of a miss is a finding shown
 * while the ledger says it is being corrected:
 *   - host pages match when the host name appears as a whole token anywhere in the entry's text;
 *   - stablecoin pages match when any product symbol on the page AND the page's chain are both named
 *     in the same entry (e.g. "EURT on Ethereum").
 */
import { LEDGER } from "../../api/corrections";

export interface Correction {
  id: string;
  date?: string;
  status?: string;
  what_was_wrong?: string;
  what_changed?: string;
  how_caught?: string;
  published_at?: string;
}

let cached: { src: unknown; out: Correction[] } | null = null;
export const ledgerEntries = (): Correction[] => {
  const src = (LEDGER as unknown as { corrections?: Correction[] }).corrections;
  if (!cached || cached.src !== src) cached = { src, out: (src || []).filter((c) => c && typeof c.id === "string") };
  return cached.out;
};

/** The ledger's own words for "not finished yet". Final states (CORRECTED, RECORDED, WITHDRAWN,
 *  RECONCILED, or an older entry with no status field) are history, not a hold. */
export const PENDING_WORDS = /\b(pending|staged|awaiting|in progress|not yet published|unverified|open|under review|investigating)\b/i;
export function isPending(c: Correction): boolean {
  return PENDING_WORDS.test(String(c.status || ""));
}

const textOf = (c: Correction) => [c.what_was_wrong, c.what_changed, c.how_caught, c.status].filter(Boolean).join(" \n ");
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every DNS name an entry's text names, lower-cased (a trailing sentence period is not part of it). */
const HOST_TOKEN = /(?<![A-Za-z0-9.-])((?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z][A-Za-z0-9-]{0,62})(?![A-Za-z0-9-])/g;
export function hostsIn(text: string): Set<string> {
  return new Set([...text.matchAll(HOST_TOKEN)].map((m) => m[1].toLowerCase()));
}

const hostIndex = new WeakMap<Correction[], Map<string, Correction[]>>();
/** host -> pending entries naming it; built once per ledger array so a 5,000-host list stays cheap. */
function pendingHostIndex(entries: Correction[]): Map<string, Correction[]> {
  let ix = hostIndex.get(entries);
  if (!ix) {
    ix = new Map();
    for (const c of entries) if (isPending(c)) for (const h of hostsIn(textOf(c))) ix.set(h, [...(ix.get(h) || []), c]);
    hostIndex.set(entries, ix);
  }
  return ix;
}

/** Our own hosts appear in almost every ledger entry as a URL, whatever the entry is about. For them,
 *  a mention holds a page only when the entry is also about that page's kind of record. */
export const OWN_HOSTS = /(^|\.)(councilof\.ai|csoai\.org)$/i;
export const TOPIC = {
  mcp: /\bMCP\b|contract[- ]parity|tools\/list/i,
  a2a: /\bA2A\b|agent[- ]card/i,
  x402: /\bx402\b/i,
} as const;

export function pendingForHost(host: string, entries: Correction[] = ledgerEntries(), topic?: RegExp): Correction[] {
  const hits = pendingHostIndex(entries).get(host.toLowerCase()) || [];
  return topic && OWN_HOSTS.test(host) ? hits.filter((c) => topic.test(textOf(c))) : hits;
}

/** Chain names as ledgers and prose write them ("bsc" is also "BNB Chain", "xrpl" also "XRP Ledger"). */
const CHAIN_ALIASES: Record<string, string[]> = {
  bsc: ["bsc", "bnb chain", "bnb smart chain", "binance smart chain"],
  xrpl: ["xrpl", "xrp ledger"],
  xrplevm: ["xrplevm", "xrpl evm"],
  zksync: ["zksync", "zksync era"],
  hyperevm: ["hyperevm", "hyperliquid"],
};

export function pendingForDeployment(symbols: string[], chain: string, entries: Correction[] = ledgerEntries()): Correction[] {
  const chainRes = (CHAIN_ALIASES[chain.toLowerCase()] || [chain]).map((n) => new RegExp(`\\b${escRe(n)}\\b`, "i"));
  const symRes = symbols.filter(Boolean).map((s) => new RegExp(`\\b${escRe(s)}\\b`, "i"));
  return entries.filter((c) => {
    if (!isPending(c)) return false;
    const t = textOf(c);
    return symRes.some((r) => r.test(t)) && chainRes.some((r) => r.test(t));
  });
}

export const correctionLink = (id: string) => `/corrections/#${encodeURIComponent(id)}`;
