/**
 * files — retired until its response can be derived from current evidence.
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
    endpoint: "/api/files",
    message: "This route is retired until its response can be derived from current evidence.",
    reason: "no file-analysis runtime; a description is not a measurement",
  }, 503);
};

export const onRequestPost: PagesFunction = async () => {
  return json({
    schema: "csoai.retired-endpoint/0.1",
    status: "UNAVAILABLE",
    code: "RETIRED",
    endpoint: "/api/files",
    message: "This route is retired until its response can be derived from current evidence.",
    reason: "no file-analysis runtime; a description is not a measurement",
  }, 503);
};
