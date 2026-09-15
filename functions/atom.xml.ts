/**
 * /atom.xml — conventional alias of /api/feed.xml (same RSS body today).
 * onRequest covers GET and HEAD; onRequestGet-only left HEAD on the SPA 404.
 */
import { onRequestGet as feedGet } from "./api/feed.xml";

export async function onRequest(ctx: { request: Request; env?: unknown; waitUntil?: (p: Promise<unknown>) => void; next?: () => Promise<Response>; data?: unknown; params?: Record<string, string> }) {
  const method = ctx.request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const res = await feedGet(ctx as never);
  if (method === "HEAD") {
    return new Response(null, { status: res.status, headers: res.headers });
  }
  return res;
}
