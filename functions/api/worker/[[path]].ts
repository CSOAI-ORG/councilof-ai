/**
 * GET /api/ledger — proxy to the Worker that holds D1 decision records.
 * Closes the loop so the frontend /refutation-ledger page renders the signed,
 * versioned ledger without the user hitting csoai-gspc-api directly.
 *
 * The Worker is the source of truth; this is a same-origin pass-through.
 */

const WORKER_URL = "https://csoai-gspc-api.nicholastempleman.workers.dev";

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace("/api/worker", "/api");
  const target = `${WORKER_URL}${path}${url.search}`;

  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 30, cacheEverything: false },
    });
    const data = await upstream.json();
    return Response.json(data, {
      status: upstream.status,
      headers: { "cache-control": "public, max-age=30" },
    });
  } catch (e: any) {
    return Response.json(
      { error: "ledger upstream unavailable", detail: e?.message ?? "unknown" },
      { status: 502 }
    );
  }
};
