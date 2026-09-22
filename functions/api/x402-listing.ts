/**
 * GET /api/x402-listing — what the PayAI discovery index holds for OUR doors, read live.
 *
 * WHY A FUNCTION AND NOT A BROWSER FETCH. The /pay page wants a per-door "listing" column read
 * from https://facilitator.payai.network/discovery/resources. Probed 2026-09-22 with an Origin
 * header: the index answers 200 with NO access-control-allow-origin, and OPTIONS answers
 * `allow: GET, HEAD` with no CORS grant either. A browser cannot read it. This Function reads it
 * server-side the way scripts/interop/x402-bazaar-audit.py does — paged by offset, the whole
 * population, so that absence is a measurement and not a guess — and returns only the rows whose
 * resource host is ours.
 *
 * WHAT A ROW MEANS. An index catalogues a resource off a CONFIRMED SETTLE through its facilitator
 * (docs/product/X402-BAZAAR-AUDIT.md, CDP-REGISTRATION.md). A row here says the index holds a
 * record for that route and when it last wrote it. It is the index's claim, verified by nothing
 * here; it is not settlement, revenue or demand.
 *
 * ABSENCE. `absence_determinate` is true only when every declared row was read. A short scan,
 * a changed total mid-walk, an oversized index or a network failure is reported as UNCHECKABLE
 * with the reason — never as "not listed", and never as 0.
 *
 * Subrequests are bounded: Pages Functions get a small per-request fetch budget, so the reader
 * asks for the largest page the index serves and refuses (UNCHECKABLE) rather than walk past
 * MAX_PAGES. Cached 5 minutes at the edge; the index itself moves slower than that.
 */

export const PAYAI_DISCOVERY_URL = "https://facilitator.payai.network/discovery/resources";
export const OUR_HOSTS = ["councilof.ai", "csoai.org"] as const;
export const PAGE_SIZE = 500;
export const MAX_PAGES = 40;
export const LISTING_SCHEMA = "csoai.x402-listing/0.1";

export type ListingRow = {
  resource: string;
  route_key: string;
  last_updated: string | null;
  x402_version: number | null;
  service_name: string | null;
  amount: string | null;
  max_timeout_seconds: number | null;
};

export type ListingReading = {
  schema: typeof LISTING_SCHEMA;
  kind: "MEASURED" | "UNCHECKABLE";
  as_of: string;
  index: { name: "PayAI"; url: string };
  declared_total: number | null;
  scanned: number;
  pages: number;
  absence_determinate: boolean;
  rows: ListingRow[];
  reason: string | null;
  note: string;
};

/** scheme://host/path with no query and no trailing slash — the audit script's route_key. */
export function routeKey(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`.replace(/\/+$/, "");
  } catch {
    return String(url || "");
  }
}

/**
 * sameResource — two spellings of one resource url. `…/wrapper?id=usdc.e:arbitrum` and
 * `…/wrapper?id=usdc.e%3Aarbitrum` are the same door (encodeURIComponent writes the second, the
 * manifest the first); the query is compared decoded, entry by entry, order-insensitively.
 */
export function sameResource(a: string, b: string): boolean {
  if (a === b) return true;
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    if (routeKey(a) !== routeKey(b)) return false;
    const qa = [...ua.searchParams.entries()].map(([k, v]) => `${k}=${v}`).sort();
    const qb = [...ub.searchParams.entries()].map(([k, v]) => `${k}=${v}`).sort();
    return qa.length === qb.length && qa.every((e, i) => e === qb[i]);
  } catch {
    return false;
  }
}

/**
 * matchesDoor — does an index row describe this door? A door is its FULL url. The index has so
 * far written our rows keyed by the bare path (the settle envelope stripped the query until
 * 2026-09-22); once it receives the full url it may write that instead, or as well. Both are the
 * same door, so a row matches on the exact resource OR on the route key — and a caller choosing
 * among several rows should prefer the exact one (see `rowForDoor`).
 */
export function matchesDoor(row: { resource: string; route_key?: string }, doorUrl: string): boolean {
  if (!row || typeof row.resource !== "string" || !row.resource) return false;
  if (sameResource(row.resource, doorUrl)) return true;
  return (row.route_key || routeKey(row.resource)) === routeKey(doorUrl);
}

/** The row for a door: the exact-resource row when the index holds one, else the route-key row. */
export function rowForDoor<T extends { resource: string; route_key?: string }>(rows: T[], doorUrl: string): T | null {
  const list = Array.isArray(rows) ? rows : [];
  return (
    list.find((r) => r && typeof r.resource === "string" && sameResource(r.resource, doorUrl)) ||
    list.find((r) => matchesDoor(r, doorUrl)) ||
    null
  );
}

function resourceUrl(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const url = (value as { url?: unknown }).url;
    if (typeof url === "string") return url;
  }
  return "";
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function isOurs(item: unknown, hosts: readonly string[] = OUR_HOSTS): boolean {
  if (!item || typeof item !== "object") return false;
  const host = hostOf(resourceUrl((item as { resource?: unknown }).resource));
  return host !== null && hosts.includes(host);
}

export function rowFrom(item: Record<string, unknown>): ListingRow {
  const resource = resourceUrl(item.resource);
  const accepts = Array.isArray(item.accepts) ? item.accepts : [];
  const first =
    accepts[0] && typeof accepts[0] === "object" ? (accepts[0] as Record<string, unknown>) : {};
  const lastUpdated = item.lastUpdated ?? item.last_updated;
  return {
    resource,
    route_key: routeKey(resource),
    last_updated: typeof lastUpdated === "string" ? lastUpdated : null,
    x402_version: typeof item.x402Version === "number" ? item.x402Version : null,
    service_name: typeof item.serviceName === "string" ? item.serviceName : null,
    amount: typeof first.amount === "string" ? first.amount : null,
    max_timeout_seconds:
      typeof first.maxTimeoutSeconds === "number" ? first.maxTimeoutSeconds : null,
  };
}

const NOTE =
  "A row is the index's own record for one of our routes, read live and verified by nothing here. " +
  "An index catalogues a resource only after a confirmed settle through its facilitator. " +
  "Absence is a finding only when absence_determinate is true.";

/**
 * readListing — walk the index and keep our rows. Pure: the fetch is injected so a test can
 * hand it pages and a short scan without any network.
 */
export async function readListing(
  fetchImpl: typeof fetch,
  opts: { indexUrl?: string; hosts?: readonly string[]; pageSize?: number; maxPages?: number } = {},
): Promise<ListingReading> {
  const indexUrl = opts.indexUrl || PAYAI_DISCOVERY_URL;
  const hosts = opts.hosts || OUR_HOSTS;
  const pageSize = opts.pageSize || PAGE_SIZE;
  const maxPages = opts.maxPages || MAX_PAGES;
  const asOf = new Date().toISOString();
  const base = (partial: Partial<ListingReading>): ListingReading => ({
    schema: LISTING_SCHEMA,
    kind: "UNCHECKABLE",
    as_of: asOf,
    index: { name: "PayAI", url: indexUrl },
    declared_total: null,
    scanned: 0,
    pages: 0,
    absence_determinate: false,
    rows: [],
    reason: null,
    note: NOTE,
    ...partial,
  });

  const rows: ListingRow[] = [];
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
          reason: `the index is larger than this reader walks (${maxPages} pages of ${pageSize}); rows seen so far are real, absence is not a finding`,
        });
      }
      const u = new URL(indexUrl);
      u.searchParams.set("limit", String(pageSize));
      u.searchParams.set("offset", String(offset));
      const r = await fetchImpl(u.toString(), {
        headers: {
          accept: "application/json",
          "user-agent": "csoai-x402-listing/0.1 (+https://councilof.ai/pay)",
        },
      });
      pages += 1;
      if (!r.ok) {
        return base({ scanned: offset, pages, rows, reason: `index answered HTTP ${r.status} at offset ${offset}` });
      }
      const body = (await r.json()) as { items?: unknown; pagination?: { total?: unknown } };
      const items = Array.isArray(body?.items) ? body.items : null;
      const total = body?.pagination?.total;
      if (!items || typeof total !== "number" || !Number.isInteger(total) || total < 0) {
        return base({ scanned: offset, pages, rows, reason: "index response lacked items[] or an integer pagination.total" });
      }
      totals.push(total);
      for (const item of items) {
        if (isOurs(item, hosts)) rows.push(rowFrom(item as Record<string, unknown>));
      }
      const required = Math.max(...totals);
      if (items.length === 0 && offset < required) {
        return base({ declared_total: required, scanned: offset, pages, rows, reason: `empty page at offset ${offset} before the declared total ${required}` });
      }
      offset += items.length;
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
      reason: `pagination.total changed during the walk (${totals.join(" → ")}); absence would be a guess`,
    });
  }
  rows.sort((a, b) => a.resource.localeCompare(b.resource));
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
  const reading = await readListing(fetch);
  return new Response(JSON.stringify(reading, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": reading.kind === "MEASURED" ? "public, max-age=300" : "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
