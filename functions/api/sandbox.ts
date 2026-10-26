/**
 * sandbox — retired until its response can be derived from current evidence.
 * @openapi-unavailable
 */
import { headFromGet } from "./_head";

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
    endpoint: "/api/sandbox",
    message: "This route is retired until its response can be derived from current evidence.",
    reason: "no sandbox runtime; a description is not execution",
  }, 503);
};

export const onRequestPost: PagesFunction = async () => {
  return json({
    schema: "csoai.retired-endpoint/0.1",
    status: "UNAVAILABLE",
    code: "RETIRED",
    endpoint: "/api/sandbox",
    message: "This route is retired until its response can be derived from current evidence.",
    reason: "no sandbox runtime; a description is not execution",
  }, 503);
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
