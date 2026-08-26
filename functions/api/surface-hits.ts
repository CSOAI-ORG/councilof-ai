/**
 * /api/surface-hits — anonymous measurement-surface hit counters.
 *
 * PRIVACY (NEXT_300 #235): path-only counters. No IP, no UA, no cookies, no
 * record content, no score bodies. Not a MEASURED number — self-reported
 * traffic signal for data earning. DSH = OS (same allowlist honesty).
 */
interface Env {
  SOV_ARENA_STATE: KVNamespace;
}

const KEY = "surface_hits_v1";

const ALLOWED = new Set([
  "/api/east-west",
  "/api/gspc",
  "/api/indices",
  "/api/rwa-attestation",
  "/api/mcp",
  "/east-west/verify",
  "/gspc-verify",
  "/indices",
  "/products",
  "/powered-by",
]);

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const raw = (await env.SOV_ARENA_STATE?.get(KEY)) || "{}";
  return new Response(raw, {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=30",
      "access-control-allow-origin": "*",
      "x-grammar": "anonymous hit counters; not a MEASURED number",
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let path = "";
  try {
    path = String((await request.json() as { path?: string }).path ?? "");
  } catch {
    return new Response('{"error":"body must be {\\"path\\":\\"/api/east-west\\"}"}', { status: 400 });
  }
  if (!ALLOWED.has(path)) {
    return new Response(JSON.stringify({ error: "path_not_allowed", allowed: [...ALLOWED] }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!env.SOV_ARENA_STATE) {
    return new Response(JSON.stringify({ counted: false, reason: "kv_unavailable", path }), {
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
    });
  }
  const t = JSON.parse((await env.SOV_ARENA_STATE.get(KEY)) || "{}") as Record<string, number>;
  t[path] = (t[path] || 0) + 1;
  await env.SOV_ARENA_STATE.put(KEY, JSON.stringify(t));
  return new Response(JSON.stringify({ counted: true, path, count: t[path], grammar: "not MEASURED" }), {
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
};
