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

  // 2026-09-11 (TUI-1): the living public-root tree keys cards by sha16 at
  // /cards/<sha16>.json; /signed/cards/<full-sha>.json is the legacy store
  // (336 files, disjoint set). Living tree first, legacy fallback, else NOT_FOUND.
  const sha16 = sha.toLowerCase().slice(0, 16);
  const living = new URL(`/cards/${sha16}.json`, url.origin);
  let response = await fetch(living, { headers: { accept: "application/json" } });
  let source = living.pathname;
  if (!response.ok) {
    const legacy = new URL(`/signed/cards/${sha.toLowerCase()}.json`, url.origin);
    response = await fetch(legacy, { headers: { accept: "application/json" } });
    source = legacy.pathname;
  }
  if (!response.ok) {
    return Response.json({ state: response.status === 404 ? "NOT_FOUND" : "UNCHECKABLE", sha: sha.toLowerCase() }, { status: response.status === 404 ? 404 : 502, headers: HEADERS });
  }

  return Response.json({
    schema: "csoai.trace/0.3",
    state: "FOUND",
    sha: sha.toLowerCase(),
    source,
    card: await response.json(),
    note: "FOUND means the named card was retrieved (living /cards/<sha16> tree, legacy /signed/cards/<full-sha> fallback). Use the family-aware verifier for hash and signature validity.",
  }, { headers: HEADERS });
};

export const onRequestPost: PagesFunction = async () => Response.json(
  { state: "METHOD_NOT_ALLOWED", accepted: false, note: "Trace is read-only. Use GET /api/trace?sha=<64-hex>." },
  { status: 405, headers: { ...HEADERS, allow: "GET" } },
);
