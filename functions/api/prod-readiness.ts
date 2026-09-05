/**
 * /api/prod-readiness — retired until readiness is derived from current evidence.
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
    endpoint: "/api/prod-readiness",
    message: "Production readiness is not published without a current evidence-derived report.",
  }, 503);
};
