/**
 * fetchWithRetry — retry only what is actually transient.
 *
 * Why this exists: /insurers failed the 2026-09-04 deploy with BAKED-FETCH-FAILURE. It
 * fetches /api/gspc at prerender time, and that endpoint intermittently returns HTTP 503
 * "error code: 1102" — Cloudflare's Worker CPU ceiling, not an outage. Measured the same
 * day: /api/gspc 2/10 failures, /api/evidence-bundle 8/10, static /root.json 0/10. One
 * unlucky 503 during prerender baked "HTTP 503" into a crawler-visible page, and the
 * prerender guard correctly refused to ship it — blocking the deploy of eight merged PRs,
 * one of which was the edge-cache fix for that very endpoint.
 *
 * Five pages fetch /api/gspc with no retry (Insurers, About, BenchmarkIndex, DeckHero,
 * CouncilConsole), so the build's success was luck about which route drew the 503.
 *
 * A CPU-limit 503 is transient by definition: the next request gets a fresh budget. Retrying
 * it is correct for real users too, not just for the build.
 *
 * What is NOT retried, deliberately: any 4xx except 429. A 404 or a 400 will return the same
 * answer however many times it is asked, and retrying it would turn a fast honest failure
 * into a slow one — and could mask a genuinely broken route behind a delay.
 */

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export async function fetchWithRetry(
  input: string,
  { attempts = 3, baseDelayMs = 400, init }: { attempts?: number; baseDelayMs?: number; init?: RequestInit } = {},
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(input, init);
      if (res.ok || !TRANSIENT_STATUS.has(res.status)) return res;
      lastErr = new Error("HTTP " + res.status);
      // Last attempt: hand back the real response so the caller reports the true status
      // rather than a synthetic error. Never invent a failure the server did not give.
      if (i === attempts - 1) return res;
    } catch (e) {
      lastErr = e;
      if (i === attempts - 1) throw e;
    }
    await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
