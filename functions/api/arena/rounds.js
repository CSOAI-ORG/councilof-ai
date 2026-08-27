// /api/arena/rounds — clean path for readiness probes + DID stranger-walk.
// Do NOT re-export from another Function module: Pages often fails to bind
// cross-file re-exports, and then functions/api/[[path]].js answers 404 JSON.
// The published static feed at /api/arena/rounds.jsonl is the reliable source.
export async function onRequestHead(context) {
  const r = await onRequestGet(context);
  return new Response(null, { status: r.status, headers: r.headers });
}

export async function onRequestGet(context) {
  const target = new URL("/api/arena/rounds.jsonl", context.request.url);
  const res = await fetch(target, {
    headers: { accept: context.request.headers.get("accept") || "*/*" },
  });
  // Preserve status/body; force a stable content-type for probes.
  const headers = new Headers(res.headers);
  if (!headers.get("content-type")) {
    headers.set("content-type", "application/x-ndjson");
  }
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=30");
  headers.set("x-arena-alias", "rounds→rounds.jsonl");
  return new Response(res.body, { status: res.status, headers });
}
