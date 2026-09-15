/**
 * /rss.xml — conventional alias of /api/feed.xml.
 * onRequest covers GET+HEAD; onRequestGet kept for adoption-loop importers.
 */
import { onRequestGet as feedGet } from "./api/feed.xml";

export const onRequestGet = feedGet;

export async function onRequest(ctx: { request: Request }) {
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
