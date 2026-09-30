/**
 * A2UI renderer-facing projection.
 * GET /api/a2ui: descriptor
 * POST /api/a2ui/run: grounded Council OS answer as A2UI v1.0 Candidate NDJSON
 * GET /api/a2ui/gspc: living /api/gspc as an A2UI surface
 */
import {
  a2uiDescriptor,
  gspcSurface,
  ndjsonResponse,
  serveA2uiRun,
} from "../../_lib/a2ui";

export const onRequest: PagesFunction = async (ctx) => {
  const sub = Array.isArray(ctx.params.path) ? ctx.params.path.join("/") : "";
  const origin = new URL(ctx.request.url).origin;

  if (sub === "" || sub === "run" || sub === "agent")
    return serveA2uiRun(ctx.request);

  if (sub === "gspc" || sub === "gspc-state") {
    if (ctx.request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "accept, content-type",
        },
      });
    if (ctx.request.method !== "GET" && ctx.request.method !== "HEAD")
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    try {
      const upstream = await fetch(origin + "/api/gspc", {
        headers: { accept: "application/json" },
      });
      if (!upstream.ok)
        return Response.json(
          { error: "gspc_upstream", status: upstream.status },
          { status: 502 },
        );
      const body = await upstream.json();
      if (ctx.request.method === "HEAD")
        return new Response(null, {
          status: 200,
          headers: {
            "content-type": "application/x-ndjson; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      return ndjsonResponse([gspcSurface(body)], 200, {
        "x-csoai-a2ui-source": "living-gspc",
      });
    } catch (e) {
      return Response.json(
        {
          error: "gspc_fetch_failed",
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 502 },
      );
    }
  }

  return Response.json(
    {
      error: "a2ui_path_not_found",
      path: "/api/a2ui/" + sub,
      descriptor: a2uiDescriptor(origin),
    },
    {
      status: 404,
      headers: {
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    },
  );
};
