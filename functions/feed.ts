/**
 * GET /feed — the card-index feed (JSON by default, RSS 2.0 with ?format=rss).
 *
 * Reads public/root.json (303 sha256 entries), fetches each card from /cards/
 * to extract surface/subject/as_of, and checks /proofs/ for tier classification.
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
 * Caching: in-memory Map with 5-minute TTL. First request fetches 303 card
 * files + 303 proof checks; subsequent requests (any query combination) read
 * from the cached full list. Cache-control: public, max-age=300 on responses.
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

let cardCache: { entries: CardEntry[]; ts: number } | null = null;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function fetchCardEntries(origin: string): Promise<CardEntry[]> {
  // Serve from cache if warm and fresh
  if (cardCache && Date.now() - cardCache.ts < CACHE_TTL_MS) {
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
  cardCache = { entries, ts: Date.now() };
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

export const onRequestGet: PagesFunction = async ({ request }) => {
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
    allEntries = await fetchCardEntries(origin);
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
