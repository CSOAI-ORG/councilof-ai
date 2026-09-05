/**
 * memory — retired until its response can be derived from current evidence.
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
    endpoint: "/api/memory",
    message: "This route is retired until its response can be derived from current evidence.",
    reason: "no per-user card-emitting runtime; every response must be a signed card",
  }, 503);
};

export const onRequestPost: PagesFunction = async () => {
  return json({
    schema: "csoai.retired-endpoint/0.1",
    status: "UNAVAILABLE",
    code: "RETIRED",
    endpoint: "/api/memory",
    message: "This route is retired until its response can be derived from current evidence.",
    reason: "no per-user card-emitting runtime; every response must be a signed card",
  }, 503);
};
