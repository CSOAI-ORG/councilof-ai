/**
 * GET /api/worker/* — proxy to the Worker that holds D1 decision records.
 * Closes the loop so the frontend /refutation-ledger page renders the signed,
 * versioned ledger without the user hitting csoai-gspc-api directly.
 *
 * The Pages directory `functions/api/worker/` swallows GET /api/worker
 * itself, so worker.ts never runs. Empty rest serves the read-only
 * public pod-health artifact (no secrets) — Maple M2 / LOOP-CONNECT.
 */

const WORKER_URL = "https://csoai-gspc-api.nicholastempleman.workers.dev";
const POD_HEALTH_PATH = "/interop/pod-health.json";

/** Null means the worker root — serve pod-health, do not proxy. */
export function workerProxyPath(pathname: string): string | null {
  const rest = pathname.replace(/^\/api\/worker\/?/, "");
  if (!rest) return null;
  return "/api/" + rest.replace(/^\//, "");
}

function stripSecrets(data: Record<string, unknown>): Record<string, unknown> {
  const banned = /token|secret|password|private|ssh|cookie|authorization|api[_-]?key|wallet|mnemonic/i;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (banned.test(k)) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = stripSecrets(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function podHealth(origin: string): Promise<Response> {
  try {
    const upstream = await fetch(new URL(POD_HEALTH_PATH, origin).toString(), {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 30, cacheEverything: false },
    });
    if (!upstream.ok) {
      return Response.json(
        {
          schema: "csoai.pod-health/0.1",
          endpoint: "/api/worker",
          status: "UNAVAILABLE",
          writes_board: false,
          never_secrets: true,
          note: `pod-health artifact HTTP ${upstream.status} — null fields, never fabricated queue`,
          source: POD_HEALTH_PATH,
        },
        { status: 200, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
      );
    }
    const raw = (await upstream.json()) as Record<string, unknown>;
    const body = {
      ...stripSecrets(raw),
      endpoint: "/api/worker",
      served_from: POD_HEALTH_PATH,
      never_secrets: true,
      writes_board: false,
    };
    return Response.json(body, {
      status: 200,
      headers: { "cache-control": "public, max-age=30", "access-control-allow-origin": "*" },
    });
  } catch (e: any) {
    return Response.json(
      {
        schema: "csoai.pod-health/0.1",
        endpoint: "/api/worker",
        status: "UNAVAILABLE",
        writes_board: false,
        never_secrets: true,
        note: `pod-health fetch failed (${e?.message ?? "unknown"}) — null, never fabricated`,
        source: POD_HEALTH_PATH,
      },
      { status: 200, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
    );
  }
}

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = workerProxyPath(url.pathname);
  if (path == null) {
    return podHealth(url.origin);
  }
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
