/**
 * HTTP layer for the ARD registry (functions/_lib/ard/registry.ts). Read-only and free: GET list and detail, POST search
 * and explore (POST only because ARD §5.3 defines them so; nothing is written). Responses are cached at the edge for
 * PAGE_TTL_S, keyed by the deploy, the path and the normalised query or body, so a new deploy never serves an old page.
 */
import { type Ctx, PAGE_TTL_S, SourceError } from "../reach/core";
import { loadMcpHost } from "../reach/mcp";
import {
  ARD_SPEC, DOCTRINE, SCORE_BASIS, SOURCE, type ArdEntry, type Filter,
  applyFilter, checkEntries, decodeToken, encodeToken, inventory, pageSizeOf, parseFilterObject, parseFilterString, textScore,
} from "./registry";

const MEASUREMENT_RULE =
  "Every entry is LISTED. metadata.measurement says whether OUR signed records measured it (MEASURED), could not (UNMEASURED), or withhold it pending a correction. Evidence fields and trust manifests appear only on MEASURED entries.";
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "x-content-type-options": "nosniff",
};

function json(status: number, body: unknown, cache = true): Response {
  return new Response(JSON.stringify(body) + "\n", {
    status,
    headers: { ...HEADERS, "cache-control": status === 200 && cache ? `public, max-age=${PAGE_TTL_S}, no-transform` : "no-store, no-transform" },
  });
}
const bad = (msg: string) => json(400, { error: "bad_request", reason: msg }, false);

const cacheOf = (): Cache | null => {
  try {
    return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default ?? null;
  } catch {
    return null;
  }
};

async function sha(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cache API in front of a JSON producer. Only 200s are stored. */
async function cached(ctx: Ctx, keyParts: string, produce: () => Promise<Response>): Promise<Response> {
  const cache = cacheOf();
  const url = new URL(ctx.request.url);
  const deploy = String(ctx.env?.CF_PAGES_COMMIT_SHA || "").slice(0, 12);
  const key = new Request(`${url.origin}${url.pathname}?__ard=${deploy}-${await sha(keyParts)}`, { method: "GET" });
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit && hit.status === 200) return new Response(hit.body, { status: 200, headers: { ...Object.fromEntries(hit.headers), "x-ard-cache": "hit" } });
    } catch {
      /* a cache fault is a miss */
    }
  }
  const res = await produce();
  if (res.status === 200 && cache) {
    const put = cache.put(key, res.clone()).catch(() => undefined);
    if (ctx.waitUntil) ctx.waitUntil(put);
  }
  return res;
}

async function inv(ctx: Ctx) {
  const { entries, sources } = await inventory(ctx);
  return { entries: checkEntries(entries), sources };
}

const envelope = (sources: Record<string, string>) => ({ source: SOURCE, spec: ARD_SPEC, doctrine: DOCTRINE, measurement_rule: MEASUREMENT_RULE, sources });

export function options(): Response {
  return new Response(null, { status: 204, headers: HEADERS });
}

/** GET /ard/v1/agents — ARD §5.3 list: filter, orderBy (identifier only), pageSize (<=100), pageToken. */
export async function list(ctx: Ctx): Promise<Response> {
  const m = ctx.request.method;
  if (m === "OPTIONS") return options();
  if (m !== "GET" && m !== "HEAD") return json(405, { error: "method_not_allowed", allow: "GET, HEAD" }, false);
  const u = new URL(ctx.request.url);
  const q = (a: string, b: string) => u.searchParams.get(a) ?? u.searchParams.get(b);
  const size = pageSizeOf(q("pageSize", "page_size"));
  if (size === null) return bad("pageSize must be a positive integer (at most 100)");
  const offset = decodeToken(q("pageToken", "page_token"));
  if (offset === null) return bad("pageToken is not one this registry issued");
  const order = u.searchParams.get("orderBy");
  if (order && order.trim() !== "identifier") return bad("orderBy supports only identifier (entries are never ranked)");
  const { filter, error } = parseFilterString(u.searchParams.get("filter"));
  if (error) return bad(error);
  return cached(ctx, `list|${size}|${offset}|${JSON.stringify(filter)}`, async () => {
    try {
      const { entries, sources } = await inv(ctx);
      const hits = applyFilter(entries, filter);
      const items = hits.slice(offset, offset + size);
      const next = offset + size < hits.length ? encodeToken(offset + size) : null;
      return json(200, {
        items, total: hits.length, ...(next ? { pageToken: next } : {}),
        // AGNTCY Directory gateway spellings, for clients written against it
        totalCount: hits.length, nextPageToken: next ?? "",
        ...envelope(sources),
      });
    } catch (e) {
      return json(503, { error: "source_unavailable", reason: String((e as Error)?.message ?? e).slice(0, 200) }, false);
    }
  });
}

/** GET /ard/v1/agents/<identifier> — one entry; census MCP hosts also carry their native endpoints (listing data). */
export async function detail(ctx: Ctx, id: string): Promise<Response> {
  const m = ctx.request.method;
  if (m === "OPTIONS") return options();
  if (m !== "GET" && m !== "HEAD") return json(405, { error: "method_not_allowed", allow: "GET, HEAD" }, false);
  if (!/^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/.test(id)) return bad("identifier must be an ARD URN (urn:air:...)");
  return cached(ctx, `detail|${id}`, async () => {
    try {
      const { entries, sources } = await inv(ctx);
      const e = entries.find((x) => x.identifier === id);
      if (!e) return json(404, { error: "not_found", identifier: id, note: "Not in this registry's inventory." }, false);
      const out: ArdEntry = { ...e, metadata: { ...e.metadata } };
      const host = /^urn:air:councilof\.ai:mcp-server:(.+)$/.exec(id)?.[1];
      if (host) {
        try {
          const h = await loadMcpHost(ctx, host);
          out.metadata["native.endpoints"] = h.endpoints.map((x) => x.u).join(" ");
          out.metadata["native.registry_ids"] = [...new Set(h.endpoints.flatMap((x) => x.reg || []))].join(" ");
        } catch (err) {
          if (!(err instanceof SourceError)) throw err;
          out.metadata["native.endpoints"] = null;
        }
      }
      checkEntries([out]);
      return json(200, { entry: out, ...envelope(sources) });
    } catch (e) {
      return json(503, { error: "source_unavailable", reason: String((e as Error)?.message ?? e).slice(0, 200) }, false);
    }
  });
}

async function body(ctx: Ctx): Promise<{ b: Record<string, unknown> | null; raw: string }> {
  const raw = await ctx.request.text();
  if (raw.length > 16_384) return { b: null, raw: "" };
  try {
    const b = JSON.parse(raw || "{}");
    return { b: b && typeof b === "object" && !Array.isArray(b) ? b : null, raw };
  } catch {
    return { b: null, raw };
  }
}

function queryOf(b: Record<string, unknown>): { text: string; filter: Filter; error: string | null } {
  const q = b.query;
  if (typeof q === "string") return { text: q, filter: {}, error: null };
  const o = (q && typeof q === "object" ? q : {}) as Record<string, unknown>;
  const text = typeof o.text === "string" ? o.text.slice(0, 500) : "";
  const { filter, error } = parseFilterObject(o.filter);
  return { text, filter, error };
}

/** POST /ard/v1/search — ARD §5.3.2. Results carry identifier, score (lexical, SCORE_BASIS) and source. No federation. */
export async function search(ctx: Ctx): Promise<Response> {
  const m = ctx.request.method;
  if (m === "OPTIONS") return options();
  if (m !== "POST") return json(405, { error: "method_not_allowed", allow: "POST" }, false);
  const { b, raw } = await body(ctx);
  if (!b) return bad("body must be a JSON object of at most 16 KiB");
  const { text, filter, error } = queryOf(b);
  if (error) return bad(error);
  const size = pageSizeOf(b.pageSize);
  if (size === null) return bad("pageSize must be a positive integer (at most 100)");
  const offset = decodeToken(typeof b.pageToken === "string" ? b.pageToken : null);
  if (offset === null) return bad("pageToken is not one this registry issued");
  return cached(ctx, `search|${await sha(raw)}`, async () => {
    try {
      const { entries, sources } = await inv(ctx);
      const scored = applyFilter(entries, filter)
        .map((e) => ({ e, score: textScore(e, text) }))
        .filter((x) => !text.trim() || x.score > 0)
        .sort((a, b2) => b2.score - a.score || (a.e.identifier < b2.e.identifier ? -1 : 1));
      const page = scored.slice(offset, offset + size);
      const next = offset + size < scored.length ? encodeToken(offset + size) : null;
      return json(200, {
        results: page.map((x) => ({ ...x.e, score: x.score, source: SOURCE })),
        referrals: [],
        total: scored.length,
        ...(next ? { pageToken: next } : {}),
        federation: "none",
        scoreBasis: SCORE_BASIS,
        ...envelope(sources),
      });
    } catch (e) {
      return json(503, { error: "source_unavailable", reason: String((e as Error)?.message ?? e).slice(0, 200) }, false);
    }
  });
}

const FACET_FIELDS = new Set(["type", "tags", "measurement", "origin"]);

/** POST /ard/v1/explore — facet counts over the matching entries. Counts of listed entries, not a ranking. */
export async function explore(ctx: Ctx): Promise<Response> {
  const m = ctx.request.method;
  if (m === "OPTIONS") return options();
  if (m !== "POST") return json(405, { error: "method_not_allowed", allow: "POST" }, false);
  const { b, raw } = await body(ctx);
  if (!b) return bad("body must be a JSON object of at most 16 KiB");
  const { text, filter, error } = queryOf(b);
  if (error) return bad(error);
  const rt = (b.resultType && typeof b.resultType === "object" ? b.resultType : {}) as Record<string, unknown>;
  const fields = (Array.isArray(rt.facets) ? rt.facets : [{ field: "measurement" }]).map((f) => String((f as Record<string, unknown>)?.field ?? ""));
  const unknown = fields.filter((f) => !FACET_FIELDS.has(f));
  if (unknown.length) return bad(`unsupported facet field(s): ${unknown.join(", ")} (supported: ${[...FACET_FIELDS].join(", ")})`);
  return cached(ctx, `explore|${await sha(raw)}`, async () => {
    try {
      const { entries, sources } = await inv(ctx);
      const hits = applyFilter(entries, filter).filter((e) => !text.trim() || textScore(e, text) > 0);
      const facets: Record<string, Record<string, number>> = {};
      for (const f of fields) {
        const c: Record<string, number> = {};
        for (const e of hits) {
          const vals = f === "tags" ? e.tags ?? [] : f === "type" ? [e.type] : [String(e.metadata[f])];
          for (const v of vals) c[v] = (c[v] ?? 0) + 1;
        }
        facets[f] = Object.fromEntries(Object.entries(c).sort(([a], [b2]) => (a < b2 ? -1 : 1)));
      }
      return json(200, { resultType: "facets", facets, total: hits.length, ...envelope(sources) });
    } catch (e) {
      return json(503, { error: "source_unavailable", reason: String((e as Error)?.message ?? e).slice(0, 200) }, false);
    }
  });
}
