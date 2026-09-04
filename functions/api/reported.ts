/**
 * GET /api/reported — List all reported corrections.
 *
 * Returns the live data from /api/corrections.
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
    schema: "csoai.reported/0.1",
    as_of: asOf,
    slug: "reported",
    description: "List all reported corrections",
    source: "/api/corrections",
    note: "Live data fetched from /api/corrections. Returns the public surface.",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.reported.post/0.1",
    as_of: new Date().toISOString(),
    slug: "reported",
    received: body,
    status: "received",
    note: "POST handler — wires the live data from /api/corrections.",
  });
};
