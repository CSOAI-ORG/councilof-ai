/**
 * GET /api/oracle-fleet — proxy to the Oracle Always-Free substrate's status.
 *
 * The micro POSTs its status to supervisor-worker (D1-backed) every 15 min —
 * hostname-only path, since CF server-side fetch rejects bare IPs (error 1003).
 * This function reads the latest payload back, same-origin over HTTPS.
 * Honest by construction: if the worker/D1 is down, the caller gets a 502 and the
 * UI shows OFFLINE — never a fabricated fleet.
 *
 * NOT a grade oracle / price feed / labour MEASURED source.
 * See docs/ORACLE_FLEET.md · docs/RUNPOD_POLICY.md · docs/SOVOS/INDEX-METHOD-0.1.md.
 */

const FLEET_URL = "https://supervisor-worker.nicholastempleman.workers.dev/fleet/status";

export const onRequest: PagesFunction = async () => {
  try {
    const upstream = await fetch(FLEET_URL, {
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
      { error: "oracle fleet upstream unavailable", detail: e?.message ?? "unknown", source: "offline" },
      { status: 502 }
    );
  }
};
