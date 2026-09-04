/**
 * GET /api/verify-card — Verify a single signed card by SHA-256.
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
    schema: "csoai.verify-card/0.1",
    as_of: new Date().toISOString(),
    slug: "verify-card",
    description: "Verify a single signed card by SHA-256",
  });
};
