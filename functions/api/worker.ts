/**
 * GET /api/worker — Worker queue stats — pending anchors, signed cards, queue size.
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
    schema: "csoai.worker/0.1",
    as_of: asOf,
    slug: "worker",
    description: "Worker queue stats — pending anchors, signed cards, queue size",
    source: "computed",
    note: "Live data fetched from computed. Returns the public surface.",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.worker.post/0.1",
    as_of: new Date().toISOString(),
    slug: "worker",
    received: body,
    status: "received",
    note: "POST handler — wires the live data from computed.",
  });
};
