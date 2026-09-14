/**
 * GET /api/worker/* — proxy to the Worker that holds D1 decision records.
 * Closes the loop so the frontend /refutation-ledger page renders the signed,
 * versioned ledger without the user hitting csoai-gspc-api directly.
 *
 * The Pages directory `functions/api/worker/` swallows GET /api/worker
 * itself, so worker.ts never runs on its own. The bare route therefore
 * DELEGATES to buildWorker (../worker.ts): the pod's own /health, LIVE or
 * OFFLINE, never a stale file (governor, 2026-09-14 — #2257 was shadowed by
 * this catch-all for an hour and the site showed a 03:55Z artifact as "LIVE").
 */
import { buildWorker } from "../worker";

const WORKER_URL = "https://csoai-gspc-api.nicholastempleman.workers.dev";

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

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = workerProxyPath(url.pathname);
  if (path == null) {
    return Response.json(await buildWorker(ctx.env as Parameters<typeof buildWorker>[0]), {
      status: 200,
      headers: { "cache-control": "public, max-age=30", "access-control-allow-origin": "*" },
    });
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
