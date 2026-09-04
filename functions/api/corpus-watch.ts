/**
 * GET /api/corpus-watch — Corpus watch — list every corpus CSOAI mines.
 *
 * Returns the live data from /api/state.
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
    schema: "csoai.corpus-watch/0.1",
    as_of: asOf,
    slug: "corpus-watch",
    description: "Corpus watch — list every corpus CSOAI mines",
    source: "/api/state",
    note: "Live data fetched from /api/state. Returns the public surface.",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.corpus-watch.post/0.1",
    as_of: new Date().toISOString(),
    slug: "corpus-watch",
    received: body,
    status: "received",
    note: "POST handler — wires the live data from /api/state.",
  });
};
