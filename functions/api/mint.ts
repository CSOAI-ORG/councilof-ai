/**
 * GET /api/mint — Mint a new signed card from an atom.
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
    schema: "csoai.mint/0.1",
    as_of: new Date().toISOString(),
    slug: "mint",
    description: "Mint a new signed card from an atom",
  });
};
