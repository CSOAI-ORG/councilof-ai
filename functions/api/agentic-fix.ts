// @openapi-unavailable
import { unavailable } from "./_unavailable";

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
