const HEADERS = {
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
};
// @openapi-post-method-not-allowed

/** Resolve one published card by exact SHA-256. This endpoint reads; it never mints. */
export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const sha = url.searchParams.get("sha") ?? "";
  if (!/^[a-f0-9]{64}$/i.test(sha)) {
    return Response.json({ state: "INVALID_REQUEST", error: "sha must be 64 hexadecimal characters" }, { status: 400, headers: HEADERS });
  }

  const target = new URL(`/signed/cards/${sha.toLowerCase()}.json`, url.origin);
  const response = await fetch(target, { headers: { accept: "application/json" } });
  if (!response.ok) {
    return Response.json({ state: response.status === 404 ? "NOT_FOUND" : "UNCHECKABLE", sha: sha.toLowerCase() }, { status: response.status === 404 ? 404 : 502, headers: HEADERS });
  }

  return Response.json({
    schema: "csoai.trace/0.2",
    state: "FOUND",
    sha: sha.toLowerCase(),
    source: target.pathname,
    card: await response.json(),
    note: "FOUND means the named file was retrieved. Use the family-aware verifier for hash and signature validity.",
  }, { headers: HEADERS });
};

export const onRequestPost: PagesFunction = async () => Response.json(
  { state: "METHOD_NOT_ALLOWED", accepted: false, note: "Trace is read-only. Use GET /api/trace?sha=<64-hex>." },
  { status: 405, headers: { ...HEADERS, allow: "GET" } },
);
