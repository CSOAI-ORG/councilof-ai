/**
 * GET /api/atlas — browser with built-in measurement.
 *
 * Every page visit is signed.
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
    schema: "csoai.atlas/0.1",
    as_of: new Date().toISOString(),
    description: "Browser with built-in measurement. Every page visit is signed.",
  });
};
