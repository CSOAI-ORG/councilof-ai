/**
 * GET /api/trace — Trace a single signed card by SHA-256.
 *
 * Returns the live data from /signed/cards/<sha>.json.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () => {
  const asOf = new Date().toISOString();
  return json({
    schema: "csoai.trace/0.1",
    as_of: asOf,
    slug: "trace",
    description: "Trace a single signed card by SHA-256",
    source: "/signed/cards/<sha>.json",
    note: "Live data fetched from /signed/cards/<sha>.json. Returns the public surface.",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.trace.post/0.1",
    as_of: new Date().toISOString(),
    slug: "trace",
    received: body,
    status: "received",
    note: "POST handler — wires the live data from /signed/cards/<sha>.json.",
  });
};
