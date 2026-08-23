/**
 * /mcp proxy — forwards MCP requests to the GSPC MCP worker.
 * Handles POST initialize, tools/list, tools/call, etc.
 * No Authorization required; public MCP endpoint.
 */

const UPSTREAM = "https://csoai-gspc-mcp.nicholastempleman.workers.dev/mcp";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const subpath = url.pathname.replace(/^\/mcp\/?/, "");
  const target = subpath ? `${UPSTREAM}/${subpath}${url.search}` : `${UPSTREAM}${url.search}`;

  const forwardHeaders = new Headers();
  for (const [k, v] of ctx.request.headers) {
    if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== "host") {
      forwardHeaders.set(k, v);
    }
  }

  try {
    const upstream = await fetch(target, {
      method: ctx.request.method,
      headers: forwardHeaders,
      body: ctx.request.body,
      // @ts-expect-error — duplex required for streaming request bodies
      duplex: "half",
    });

    const responseHeaders = new Headers();
    for (const [k, v] of upstream.headers) {
      if (!HOP_BY_HOP.has(k.toLowerCase())) {
        responseHeaders.set(k, v);
      }
    }
    responseHeaders.set("access-control-allow-origin", "*");
    responseHeaders.set("access-control-allow-methods", "GET, POST, OPTIONS");
    responseHeaders.set("access-control-allow-headers", "content-type");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return Response.json(
      { error: "mcp upstream unavailable", detail: msg },
      {
        status: 502,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
      }
    );
  }
};
