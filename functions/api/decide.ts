/**
 * GET /api/decide — Make a decision attestation.
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
    schema: "csoai.decide/0.1",
    as_of: new Date().toISOString(),
    slug: "decide",
    description: "Make a decision attestation",
  });
};
