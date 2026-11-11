/**
 * GET /feed — the card-index feed (JSON by default, RSS 2.0 with ?format=rss).
 *
 * Reads the ordered card index in public/root.json, fetches each card from
 * /cards/ to extract surface/subject/as_of, and checks /proofs/ for tier classification.
 *
 * Query parameters:
 *   ?format=rss   — RSS 2.0 XML instead of JSON
 *   ?family=<surface> — filter by card surface/family prefix
 *   ?tier=free|proof  — filter by proof availability
 *   ?limit=N      — max results (default 50, max 303)
 *
 * Does NOT conflict with /feed.xml (the hand-maintained state-change RSS) or
 * /api/feed.xml (its handler). This feed is derived from the card index, not
 * hand-curated.
 *
 * Internal caching: completed entries have a 5-minute TTL. The memory cache and an
 * optional, origin/root-bound Cache API entry retain the same observation time.
 * A fresh isolate can reuse a completed load in the same edge location. A cache
 * miss still reads every mirrored card/proof; this does not remove first-cold
 * fan-out or establish fresh proof availability on a cache hit. Request-scoped
 * waitUntil may let already-started loading finish after a client disconnects,
 * within the platform's shared 30-second continuation budget; completion is not
 * guaranteed and this starts no retry or background job.
 * Public response Cache-Control remains public, max-age=300; client cache age
 * is separate from the internal observation timestamp.
 */
import { headFromGet } from "./api/_head";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CardEntry {
  sha256: string;
  surface: string;
  subject: string;
  as_of: string;
  tier: "free" | "proof";
}

type CardCache = { entries: CardEntry[]; ts: number; origin: string };
let cardCache: CardCache | null = null;

const EDGE_CACHE_SCHEMA = "csoai.card-feed-cache/1";
const ENTRY_KEYS = ["as_of", "sha256", "subject", "surface", "tier"];

function fresh(ts: unknown, now: number): ts is number {
  return typeof ts === "number" && Number.isSafeInteger(ts) && ts <= now && now - ts < CACHE_TTL_MS;
}

function validEntries(entries: unknown, shas: string[]): entries is CardEntry[] {
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > shas.length) return false;
  let next = 0;
  const seen = new Set<string>();
  return entries.every((entry) => {
    if (!entry || typeof entry !== "object" ||
        Object.keys(entry).sort().join(",") !== ENTRY_KEYS.join(",") ||
        typeof entry.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(entry.sha256) ||
        typeof entry.surface !== "string" || typeof entry.subject !== "string" ||
        typeof entry.as_of !== "string" || !["free", "proof"].includes(entry.tier) ||
        seen.has(entry.sha256)) return false;
    const index = shas.indexOf(entry.sha256, next);
    if (index < 0) return false;
    next = index + 1;
    seen.add(entry.sha256);
    return true;
  });
}

async function edgeCacheForRoot(origin: string, root: unknown) {
  try {
    const cache = typeof caches === "undefined" ? undefined :
      (caches as CacheStorage & { default?: Cache }).default;
    if (!cache) return null;
    // Bind the complete public root, including its ordering/as_of. Keep only
    // derived public metadata in this cache; no request headers or card bodies.
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(root)));
    const rootDigest = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    const key = new Request(`${origin}/.well-known/csoai-card-feed-cache/v1/${rootDigest}`);
    return { cache, key, rootDigest };
  } catch {
    return null; // Optional transport cache must not replace the existing source path.
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function fetchCardEntries(origin: string, waitUntil?: (promise: Promise<unknown>) => void): Promise<CardEntry[]> {
  // Serve from cache if warm and fresh
  if (cardCache?.origin === origin && fresh(cardCache.ts, Date.now())) {
    return cardCache.entries;
  }

  // Read the root index
  const rootRes = await fetch(`${origin}/root.json`, {
    cf: { cacheTtl: 300, cacheEverything: true },
  } as RequestInit);
  if (!rootRes.ok) {
    throw new Error(`root.json HTTP ${rootRes.status}`);
  }

  const root = (await rootRes.json()) as {
    card_sha256?: string[];
    as_of?: string;
    card_count?: number;
  };
  if (!Array.isArray(root.card_sha256) || root.card_sha256.length === 0) {
    throw new Error("root.json has no card_sha256 array");
  }

  const shas = root.card_sha256 as string[];

  const edge = await edgeCacheForRoot(origin, root);
  if (edge) {
    try {
      const response = await edge.cache.match(edge.key);
      if (response?.status === 200 && response.headers.get("x-csoai-feed-cache") === "1") {
        const saved = await response.json() as Record<string, unknown>;
        if (saved.schema === EDGE_CACHE_SCHEMA && saved.origin === origin &&
            saved.root_digest === edge.rootDigest && fresh(saved.ts, Date.now()) &&
            validEntries(saved.entries, shas)) {
          // Preserve the original observation time: reading a cache cannot
          // renew the 300-second lifetime or reclassify mirror availability.
          cardCache = { entries: saved.entries, ts: saved.ts, origin };
          return cardCache.entries;
        }
      }
    } catch {
      // Missing, corrupt, inaccessible or incompatible cache: read the sources.
    }
  }

  // Fetch all card + proof files in parallel.
  // Cards give us surface, subject, as_of. Proofs give us tier.
  const cardPromises = shas.map((sha) => {
    const prefix = sha.slice(0, 16);
    return fetch(`${origin}/cards/${prefix}.json`, {
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  });

  const proofPromises = shas.map((sha) => {
    const prefix = sha.slice(0, 16);
    return fetch(`${origin}/proofs/${prefix}.json`, {
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  });

  const [cardResults, proofResults] = await Promise.all([
    Promise.all(cardPromises),
    Promise.all(proofPromises),
  ]);

  const entries: CardEntry[] = [];
  for (let i = 0; i < shas.length; i++) {
    const sha = shas[i];
    const cardJson = cardResults[i] as
      | { card?: { surface?: string; subject?: string; as_of?: string } }
      | null;
    const proofJson = proofResults[i] as
      | { proof?: string[] | unknown[] }
      | null;

    if (!cardJson?.card) continue; // skip unreadable cards

    const c = cardJson.card;
    // G5.1: read tier from the product block when present (after next publish);
    // fall back to proof-based heuristic for pre-v0.1 cards.
    const productTier = (c as Record<string, unknown>).product as
      | { tier?: string }
      | undefined;
    const hasProof =
      proofJson &&
      Array.isArray(proofJson.proof) &&
      proofJson.proof.length > 0;

    entries.push({
      sha256: sha,
      surface: c.surface ?? "unknown",
      subject: c.subject ?? "",
      as_of: c.as_of ?? "",
      tier: productTier?.tier === "proof" ? "proof" : hasProof ? "proof" : "free",
    });
  }

  // Warm the cache
  cardCache = { entries, ts: Date.now(), origin };
  if (edge && validEntries(entries, shas)) {
    const saved = {
      schema: EDGE_CACHE_SCHEMA, origin, root_digest: edge.rootDigest,
      ts: cardCache.ts, entries,
    };
    try {
      const write = edge.cache.put(edge.key, Response.json(saved, { headers: {
        "cache-control": "public, max-age=300",
        "x-csoai-feed-cache": "1",
      } })).catch(() => undefined);
      if (waitUntil) waitUntil(write);
      else await write;
    } catch {
      // Even a synchronous cache/runtime failure leaves the source result intact.
    }
  }
  return entries;
}

function buildRss(
  entries: CardEntry[],
  count: number,
  asOf: string,
  origin: string,
): string {
  const now = new Date().toUTCString();
  const items = entries
    .map(
      (c) => `    <item>
      <title>${esc(c.subject)}</title>
      <link>${origin}/cards/${c.sha256.slice(0, 16)}.json</link>
      <pubDate>${c.as_of ? new Date(c.as_of).toUTCString() : now}</pubDate>
      <guid isPermaLink="false">${c.sha256}</guid>
      <description>surface: ${esc(c.surface)} | tier: ${c.tier} | sha256: ${c.sha256}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Council of AI — card feed</title>
    <link>${origin}/feed</link>
    <description>Public card index (${count} cards as of ${asOf}). Derived from /root.json, not hand-curated. Measurement, not certification.</description>
    <language>en-gb</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${origin}/feed?format=rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

export const onRequestGet: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const origin = url.origin;

  // Parse query parameters
  const family = url.searchParams.get("family");
  const tierParam = url.searchParams.get("tier");
  const limitParam = url.searchParams.get("limit");
  const formatParam = url.searchParams.get("format");

  // Validate tier
  if (tierParam && tierParam !== "free" && tierParam !== "proof") {
    return Response.json(
      {
        error: "invalid_tier",
        detail: `tier must be "free" or "proof", got "${tierParam}"`,
      },
      {
        status: 400,
        headers: {
          "cache-control": "public, max-age=60",
          "access-control-allow-origin": "*",
        },
      },
    );
  }

  // Validate and clamp limit
  let limit = 50;
  if (limitParam !== null) {
    const parsed = Number(limitParam);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return Response.json(
        {
          error: "invalid_limit",
          detail: `limit must be a positive integer, got "${limitParam}"`,
        },
        {
          status: 400,
          headers: {
            "cache-control": "public, max-age=60",
            "access-control-allow-origin": "*",
          },
        },
      );
    }
    limit = Math.min(Math.max(1, Math.floor(parsed)), 303);
  }

  let allEntries: CardEntry[];
  try {
    const loading = fetchCardEntries(origin, context.waitUntil?.bind(context));
    try {
      // Keep this request's existing load alive long enough to attempt a cache
      // fill after disconnect. No promise or I/O is shared with another request.
      context.waitUntil?.(loading.then(() => undefined, () => undefined));
    } catch {
      // A runtime without continuation support still follows the normal await.
    }
    allEntries = await loading;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return Response.json(
      {
        error: "upstream_failure",
        detail: `Could not read card index: ${msg}`,
        note: "The static /root.json or its card files may be unavailable on this deploy.",
      },
      {
        status: 503,
        headers: {
          "cache-control": "public, max-age=30",
          "access-control-allow-origin": "*",
        },
      },
    );
  }

  if (allEntries.length === 0) {
    return Response.json(
      {
        error: "empty_index",
        detail: "root.json parsed but yielded zero card entries",
        note: "The card files under /cards/ may be missing on this deploy.",
      },
      {
        status: 503,
        headers: {
          "cache-control": "public, max-age=30",
          "access-control-allow-origin": "*",
        },
      },
    );
  }

  // Apply filters
  let filtered = allEntries;
  if (family) {
    filtered = filtered.filter(
      (c) => c.surface === family || c.surface.startsWith(family + "."),
    );
  }
  if (tierParam) {
    filtered = filtered.filter((c) => c.tier === tierParam);
  }

  const slice = filtered.slice(0, limit);
  const asOf =
    allEntries.reduce(
      (latest, c) => (c.as_of > latest ? c.as_of : latest),
      "",
    ) || new Date().toISOString();

  // Content negotiation: ?format=rss or Accept: application/rss+xml
  const wantsRss =
    formatParam === "rss" ||
    (request.headers.get("accept") || "").includes("application/rss+xml");

  if (wantsRss) {
    return new Response(buildRss(slice, filtered.length, asOf, origin), {
      headers: {
        "content-type": "application/rss+xml; charset=utf-8",
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*",
      },
    });
  }

  // JSON response
  return Response.json(
    {
      as_of: asOf,
      count: filtered.length,
      returned: slice.length,
      cards: slice,
    },
    {
      headers: {
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*",
      },
    },
  );
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
