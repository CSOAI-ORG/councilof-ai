/**
 * GET /api/include — Merkle inclusion proof for a card.
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
  return json({
    schema: "csoai.include/0.1",
    as_of: new Date().toISOString(),
    slug: "include",
    description: "Merkle inclusion proof for a card",
  });
};
