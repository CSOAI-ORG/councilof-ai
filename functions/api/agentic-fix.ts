// @openapi-unavailable
import { unavailable } from "./_unavailable";
import { headFromGet } from "./_head";

const reply = () => unavailable(
  "/api/agentic-fix",
  "Detect, remediate, retest, and emit a verifiable receipt through a durable worker queue",
  503,
);

export const onRequestGet: PagesFunction = async () => reply();
export const onRequestPost: PagesFunction = async () => reply();
export const onRequestOptions: PagesFunction = async () => new Response(null, {
  status: 204,
  headers: {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
  },
});

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
