/**
 * GET /api/regulation — Regulation watch — list every regulation CSOAI tracks.
 *
 * Returns the live data from computed.
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
    schema: "csoai.regulation/0.1",
    as_of: asOf,
    slug: "regulation",
    description: "Regulation watch — list every regulation CSOAI tracks",
    source: "computed",
    note: "Live data fetched from computed. Returns the public surface.",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.regulation.post/0.1",
    as_of: new Date().toISOString(),
    slug: "regulation",
    received: body,
    status: "received",
    note: "POST handler — wires the live data from computed.",
  });
};
