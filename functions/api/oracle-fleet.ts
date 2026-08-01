/**
 * GET /api/oracle-fleet — proxy to the Oracle Always-Free substrate's status.
 *
 * The micro serves fleet_status_oracle.json over plain HTTP on :8080 (a port
 * Cloudflare's server-side fetch() allows — :8077 is rejected with error 1003).
 * on an HTTPS page could never fetch that (mixed content) — so this Pages
 * Function fetches it server-side and returns it same-origin over HTTPS.
 * Honest by construction: if the micro is down, the caller gets a 502 and the
 * UI shows OFFLINE — never a fabricated fleet.
 */

const FLEET_URL = "http://141.147.73.85:8080/fleet_status_oracle.json";

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
