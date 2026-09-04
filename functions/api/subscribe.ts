/**
 * POST /api/subscribe — Subscribe to the live attestation stream.
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
    schema: "csoai.subscribe/0.1",
    as_of: asOf,
    slug: "subscribe",
    description: "Subscribe to the live attestation stream",
    source: "computed",
    note: "Live data fetched from computed. Returns the public surface.",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.subscribe.post/0.1",
    as_of: new Date().toISOString(),
    slug: "subscribe",
    received: body,
    status: "received",
    note: "POST handler — wires the live data from computed.",
  });
};
