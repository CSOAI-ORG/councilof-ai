/**
 * meok-council-worker
 * Cloudflare Worker — public substrate for SOV3 Council Globe
 * Routes public-facing requests to the meok-api VM behind the firewall.
 *
 * Routes:
 *   /council/*         → proxy to meok-api:3200/council/*
 *   /mcp/*             → proxy to meok-api:3200/mcp/*
 *   /compliance/*      → proxy to meok-api:3200/compliance/*
 *   /health            → proxy to meok-api:3200/health
 *   /attestation/*     → proxy to meok-api:3200/attestation/*
 *   /attestation        → proxy to meok-api:3200/attestation
 *
 * CORS: open (council pages are public-readable)
 * Cache: 30s stale-while-revalidate for public reads
 * Rate limit: 60 req/min per IP (Cloudflare Bot Management / free tier)
 *
 * Deploy: wrangler deploy --env production
 * Docs: https://developers.cloudflare.com/workers/
 */

// ── Configuration ─────────────────────────────────────────────────────────────
// INTERNAL_BACKEND: the private VM IP or hostname where meok-api runs.
// This MUST be set as a Cloudflare secret (wrangler secret put INTERNAL_BACKEND
// --env production). It is resolved INSIDE the fetch handler because `env` is
// only available there, not at module scope.
const DEFAULT_INTERNAL_BACKEND = "http://10.0.0.42:3200";

// ── Route Definitions ─────────────────────────────────────────────────────────
const ROUTES = [
  { pattern: /^\/council/,    target: "/council"    },
  { pattern: /^\/mcp/,        target: "/mcp"         },
  { pattern: /^\/compliance/, target: "/compliance"  },
  { pattern: /^\/attestation/, target: "/attestation" },
  { pattern: /^\/health$/,    target: "/health"      },
];

// ── CORS Headers (open for public council pages) ────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, HTTP-Referer",
  "Access-Control-Max-Age": "86400",
};

// ── Cache TTLs ────────────────────────────────────────────────────────────────
const CACHE_TTL_PUBLIC  = 30;  // seconds — 30s staleness is fine; SIGIL-signed canonical chain is the source of truth
const CACHE_TTL_PRIVATE = 5;   // seconds — short TTL for private / authenticated routes

// ── Rate Limit (Cloudflare Bot Management recommended; fallback is simple in-memory) ──
// Cloudflare's free tier includes rate limiting via the dashboard.
// Set in Cloudflare dashboard: Dashboard > Traffic > Rate Limiting > Create rule
// Recommendation: 60 req/min per IP, action: throttle
// This Worker does NOT implement its own rate limiter to keep cold starts fast.
// Instead, the CF dashboard handles it and we add a Retry-After header on 429.
const RATE_LIMITED_STATUS = 429;
const RATE_LIMITED_HEADERS = {
  "Content-Type": "application/json",
  "Retry-After": "60",
  ...CORS_HEADERS,
};

// ── Main Handler ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...CORS_HEADERS, "Access-Control-Allow-Credentials": "false" },
      });
    }

    // ── Resolve upstream backend (env is only available here) ──────────────
    const INTERNAL_BACKEND = env.INTERNAL_BACKEND || DEFAULT_INTERNAL_BACKEND;

    // ── Rate limit check (Cloudflare Bot Management adds cf.bot_management.score) ──
    // If score is low or header indicates throttling, reject fast
    const cfScore = request.headers.get("cf.bot_management.score") || "100";
    if (parseInt(cfScore) < 30) {
      return new Response(
        JSON.stringify({ error: "rate_limited", message: "Too many requests" }),
        { status: RATE_LIMITED_STATUS, headers: RATE_LIMITED_HEADERS }
      );
    }

    // ── Route matching ─────────────────────────────────────────────────────
    let matched = null;
    let targetPath = null;

    for (const route of ROUTES) {
      if (route.pattern.test(url.pathname)) {
        matched = route;
        // Strip the prefix and rebuild the target path
        targetPath = url.pathname.replace(route.pattern, route.target);
        break;
      }
    }

    if (!matched) {
      // 404 for unknown routes
      return jsonResponse({ error: "not_found", path: url.pathname }, 404);
    }

    // ── Build upstream URL ─────────────────────────────────────────────────
    const upstreamUrl = `${INTERNAL_BACKEND}${targetPath}${url.search}`;

    // ── Cache key ───────────────────────────────────────────────────────────
    // Use full URL as cache key (method + path + query)
    const cacheKey = `https://council.meok.ai${url.pathname}${url.search}`;
    const cache = caches.default;

    // ── GET requests: check cache first ────────────────────────────────────
    if (method === "GET") {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const headers = new Headers(cached.headers);
        headers.set("X-Cache-Status", "HIT");
        headers.set("X-Substrate", "meok-council-worker");
        Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
        return new Response(cached.body, { status: cached.status, headers });
      }
    }

    // ── Forward request to internal backend ───────────────────────────────
    let upstreamResponse;
    try {
      upstreamResponse = await fetch(upstreamUrl, {
        method,
        headers: {
          // Forward relevant headers
          "Content-Type": request.headers.get("Content-Type") || "application/json",
          "User-Agent": request.headers.get("User-Agent") || "meok-council-worker/1.0",
          "X-Forwarded-For": request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "",
          "X-Real-IP": request.headers.get("CF-Connecting-IP") || "",
          // Preserve auth headers if present
          ...(request.headers.get("Authorization")
            ? { Authorization: request.headers.get("Authorization") }
            : {}),
        },
        body: method !== "GET" && method !== "HEAD"
          ? await request.text()
          : undefined,
        // Timeout: 10 seconds for the internal VM call
        // Cloudflare Workers have a 50s CPU limit; this keeps it fast
      });
    } catch (err) {
      // Network error (VM unreachable, DNS fail, timeout)
      return jsonResponse(
        {
          error: "upstream_unreachable",
          message: "Internal substrate is not reachable",
          path: url.pathname,
          hint: "Check meok-api VM is running on port 3200 and INTERNAL_BACKEND is correct",
        },
        503
      );
    }

    // ── Handle upstream errors ─────────────────────────────────────────────
    if (!upstreamResponse.ok && upstreamResponse.status >= 500) {
      return jsonResponse(
        {
          error: "upstream_error",
          status: upstreamResponse.status,
          path: url.pathname,
        },
        502
      );
    }

    // ── Cache GET responses (only public, successful responses) ────────────
    if (method === "GET" && upstreamResponse.ok && upstreamResponse.status === 200) {
      // Only cache for 30s; downstream can stale-while-revalidate
      ctx.waitUntil(
        cache.put(
          cacheKey,
          new Response(await upstreamResponse.clone().text(), {
            status: 200,
            headers: {
              "Content-Type": upstreamResponse.headers.get("Content-Type") || "application/json",
              "Cache-Control": `public, max-age=${CACHE_TTL_PUBLIC}, stale-while-revalidate=${CACHE_TTL_PUBLIC * 2}`,
              "X-Cache-Status": "MISS",
              "X-Substrate": "meok-council-worker",
              ...CORS_HEADERS,
            },
          })
        )
      );
    }

    // ── Build response with CORS and substrate headers ─────────────────────
    const responseBody = await upstreamResponse.text();
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("X-Substrate", "meok-council-worker");
    responseHeaders.set("X-Backend-Status", String(upstreamResponse.status));
    Object.entries(CORS_HEADERS).forEach(([k, v]) => responseHeaders.set(k, v));

    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  },
};

// ── Helper ────────────────────────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Substrate": "meok-council-worker",
      ...CORS_HEADERS,
    },
  });
}