/**
 * GET /api/x402-listing-402index — what the 402 Index (402index.io) holds for OUR doors, read live.
 *
 * WHY A SECOND READER. /api/x402-listing reads the PayAI facilitator's discovery index — the one
 * that catalogues a door only off a confirmed settle. The 402 Index is a different catalogue:
 * an authless registry that probes each listed url on a schedule and records a health_status.
 * A door can be in one and not the other; the /pay page shows both, from their own bytes.
 *
 * WHAT IS READ. https://402index.io/api/v1/services?q=councilof.ai&limit=100&offset=N, paged by
 * offset until the walk covers the declared `total` (fields read: total, limit, offset,
 * services[].url, services[].health_status, services[].last_checked, and the row's own id, name,
 * registered_at, probe_status, domain_verified). Only rows whose url host is ours are kept.
 * A fixture of this exact response, unedited, sits under fixtures/402index/ with the fetch date.
 *
 * ABSENCE. `absence_determinate` is true only when every declared row of the SEARCH was read.
 * The search is `q=councilof.ai` — the population the index itself offers for a host. A short
 * scan, a moving total, an oversized result or a network failure is UNCHECKABLE with the reason:
 * never "not listed", never 0. A row is the index's own claim (its probe, its clock), verified
 * by nothing here; it is not settlement, revenue or demand.
 *
 * Cached ten minutes at the edge when the read was complete; no-store otherwise.
 */
import { OUR_HOSTS, routeKey } from "./x402-listing";
import { headFromGet } from "./_head";

export const FOUR02_INDEX_URL = "https://402index.io/api/v1/services";
export const FOUR02_QUERY = "councilof.ai";
export const FOUR02_PAGE_SIZE = 100;
export const FOUR02_MAX_PAGES = 20;
export const FOUR02_SCHEMA = "csoai.x402-listing-402index/0.1";
export const FOUR02_CACHE_SECONDS = 600;

export type Index402Row = {
  url: string;
  route_key: string;
  health_status: string | null;
  probe_status: string | null;
  last_checked: string | null;
  registered_at: string | null;
  domain_verified: boolean | null;
  id: string | null;
  name: string | null;
};

export type Index402Reading = {
  schema: typeof FOUR02_SCHEMA;
  kind: "MEASURED" | "UNCHECKABLE";
  as_of: string;
  index: { name: "402 Index"; url: string; query: string };
  declared_total: number | null;
  scanned: number;
  pages: number;
  absence_determinate: boolean;
  rows: Index402Row[];
  reason: string | null;
  note: string;
};

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Ours by the url's host — never by a name or description that mentions us. */
export function isOurService(item: unknown, hosts: readonly string[] = OUR_HOSTS): boolean {
  if (!item || typeof item !== "object") return false;
  const url = (item as { url?: unknown }).url;
  if (typeof url !== "string") return false;
  const host = hostOf(url);
  return host !== null && hosts.includes(host);
}

const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

/** One index row, read field by field; a field the index did not write is null, never guessed. */
export function rowFromService(item: Record<string, unknown>): Index402Row {
  const url = typeof item.url === "string" ? item.url : "";
  const dv = item.domain_verified;
  return {
    url,
    route_key: routeKey(url),
    health_status: str(item.health_status),
    probe_status: str(item.probe_status),
    last_checked: str(item.last_checked),
    registered_at: str(item.registered_at),
    domain_verified: dv === 1 || dv === true ? true : dv === 0 || dv === false ? false : null,
    id: str(item.id),
    name: str(item.name),
  };
}

const NOTE =
  "A row is the 402 Index's own record for one of our urls — its probe, its health word, its clock — read live and " +
  "verified by nothing here. Presence in this index is not a settle and not demand. Absence is a finding only when " +
  "absence_determinate is true, and then only within the search the index offers (q=councilof.ai).";

/**
 * readIndex402 — walk the search and keep our rows. Pure: fetch is injected so a test can feed
 * it the saved real pages and a short scan without any network.
 */
export async function readIndex402(
  fetchImpl: typeof fetch,
  opts: { indexUrl?: string; query?: string; hosts?: readonly string[]; pageSize?: number; maxPages?: number } = {},
): Promise<Index402Reading> {
  const indexUrl = opts.indexUrl || FOUR02_INDEX_URL;
  const query = opts.query || FOUR02_QUERY;
  const hosts = opts.hosts || OUR_HOSTS;
  const pageSize = opts.pageSize || FOUR02_PAGE_SIZE;
  const maxPages = opts.maxPages || FOUR02_MAX_PAGES;
  const asOf = new Date().toISOString();
  const base = (partial: Partial<Index402Reading>): Index402Reading => ({
    schema: FOUR02_SCHEMA,
    kind: "UNCHECKABLE",
    as_of: asOf,
    index: { name: "402 Index", url: indexUrl, query },
    declared_total: null,
    scanned: 0,
    pages: 0,
    absence_determinate: false,
    rows: [],
    reason: null,
    note: NOTE,
    ...partial,
  });

  const rows: Index402Row[] = [];
  const totals: number[] = [];
  let offset = 0;
  let pages = 0;
  try {
    for (;;) {
      if (pages >= maxPages) {
        return base({
          declared_total: totals.length ? Math.max(...totals) : null,
          scanned: offset,
          pages,
          rows,
          reason: `the search is larger than this reader walks (${maxPages} pages of ${pageSize}); rows seen so far are real, absence is not a finding`,
        });
      }
      const u = new URL(indexUrl);
      u.searchParams.set("q", query);
      u.searchParams.set("limit", String(pageSize));
      u.searchParams.set("offset", String(offset));
      const r = await fetchImpl(u.toString(), {
        headers: {
          accept: "application/json",
          "user-agent": "csoai-x402-listing-402index/0.1 (+https://councilof.ai/pay)",
        },
      });
      pages += 1;
      if (!r.ok) {
        return base({ scanned: offset, pages, rows, reason: `index answered HTTP ${r.status} at offset ${offset}` });
      }
      const body = (await r.json()) as { services?: unknown; total?: unknown };
      const services = Array.isArray(body?.services) ? body.services : null;
      const total = body?.total;
      if (!services || typeof total !== "number" || !Number.isInteger(total) || total < 0) {
        return base({ scanned: offset, pages, rows, reason: "index response lacked services[] or an integer total" });
      }
      totals.push(total);
      for (const item of services) {
        if (isOurService(item, hosts)) rows.push(rowFromService(item as Record<string, unknown>));
      }
      const required = Math.max(...totals);
      if (services.length === 0 && offset < required) {
        return base({ declared_total: required, scanned: offset, pages, rows, reason: `empty page at offset ${offset} before the declared total ${required}` });
      }
      offset += services.length;
      if (offset >= required) break;
    }
  } catch (e) {
    return base({
      declared_total: totals.length ? Math.max(...totals) : null,
      scanned: offset,
      pages,
      rows,
      reason: `could not read the index: ${(e as Error)?.message || String(e)}`,
    });
  }

  const declared = Math.max(...totals);
  if (new Set(totals).size > 1) {
    return base({
      declared_total: declared,
      scanned: offset,
      pages,
      rows,
      reason: `total changed during the walk (${totals.join(" → ")}); absence would be a guess`,
    });
  }
  rows.sort((a, b) => a.url.localeCompare(b.url));
  return base({
    kind: "MEASURED",
    declared_total: declared,
    scanned: offset,
    pages,
    absence_determinate: offset >= declared,
    rows,
  });
}

export const onRequestGet: PagesFunction = async () => {
  const reading = await readIndex402(fetch);
  return new Response(JSON.stringify(reading, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": reading.kind === "MEASURED" ? `public, max-age=${FOUR02_CACHE_SECONDS}` : "no-store",
      "access-control-allow-origin": "*",
    },
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
