/**
 * /api/growth-loops — retired until loop status is derived from current evidence.
 * @openapi-unavailable
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
    schema: "csoai.retired-endpoint/0.1",
    status: "UNAVAILABLE",
    code: "RETIRED",
    endpoint: "/api/growth-loops",
    message: "Growth-loop status is not published without current runtime evidence.",
  }, 503);
};
