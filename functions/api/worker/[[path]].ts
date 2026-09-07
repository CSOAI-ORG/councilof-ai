/**
 * GET /api/worker/* — proxy to the Worker that holds D1 decision records.
 * Closes the loop so the frontend /refutation-ledger page renders the signed,
 * versioned ledger without the user hitting csoai-gspc-api directly.
 *
 * The Pages directory `functions/api/worker/` swallows GET /api/worker
 * itself, so worker.ts never runs. Empty rest must 501 NOT_IMPLEMENTED,
 * not proxy to WORKER_URL/api (live 404 "Not found").
 */

import { unavailable } from "../_unavailable";

const WORKER_URL = "https://csoai-gspc-api.nicholastempleman.workers.dev";

/** Null means the worker root — do not proxy. */
export function workerProxyPath(pathname: string): string | null {
  const rest = pathname.replace(/^\/api\/worker\/?/, "");
  if (!rest) return null;
  return "/api/" + rest.replace(/^\//, "");
}

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = workerProxyPath(url.pathname);
  if (path == null) {
    return unavailable(
      "/api/worker",
      "Return current durable worker-queue and anchor-processing state",
    );
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
