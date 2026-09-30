/**
 * A2UI renderer-facing projection.
 * GET /api/a2ui: descriptor
 * POST /api/a2ui/run: grounded Council OS answer as A2UI v1.0 Candidate NDJSON
 * GET /api/a2ui/gspc: living /api/gspc as an A2UI surface
 * GET /api/a2ui/board: the GSPC board card (board_totals), A2UI v0.9.1 by default
 * GET|POST /api/a2ui/verify: a verify_card result, A2UI v0.9.1 by default
 */
import { sharedToolResult } from "../../mcp/_handlers";
import {
  A2UI_SPECS,
  boardCardSurface,
  pickA2uiVersion,
  surfaceMessages,
  verifyResultSurface,
} from "../../_lib/a2uiSurfaces";
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

  if (sub === "board" || sub === "verify") {
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "accept, content-type",
    };
    if (ctx.request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(ctx.request.url);
    const version = pickA2uiVersion(url.searchParams.get("version"));
    const spec = A2UI_SPECS[version];
    const labels = { "x-csoai-a2ui": spec.version, "x-csoai-a2ui-status": spec.status, "x-csoai-a2ui-spec": spec.spec };
    try {
      if (sub === "board") {
        if (ctx.request.method !== "GET" && ctx.request.method !== "HEAD")
          return Response.json({ error: "method_not_allowed" }, { status: 405, headers: cors });
        const r = await sharedToolResult("board_totals", {}, origin);
        const sc = r.structuredContent;
        return ndjsonResponse(surfaceMessages(boardCardSurface(sc), version), r.isError ? 502 : 200, { ...labels, "x-csoai-a2ui-source": "board_totals" });
      }
      let card: unknown = url.searchParams.get("card");
      if (ctx.request.method === "POST") {
        const body = (await ctx.request.json().catch(() => null)) as { card?: unknown } | null;
        card = body?.card ?? card;
      } else if (ctx.request.method !== "GET" && ctx.request.method !== "HEAD") {
        return Response.json({ error: "method_not_allowed" }, { status: 405, headers: cors });
      }
      if (card === null || card === undefined || card === "") {
        return ndjsonResponse(
          surfaceMessages({ surfaceId: "gspc_verify_needs_input", components: [{ id: "root", component: "Text", text: { path: "/message" }, variant: "body" }], dataModel: { message: "Send card: a 64-hex card id, a councilof.ai card URL or the card JSON.", state: "NEEDS_INPUT" } }, version),
          400,
          { ...labels, "x-csoai-a2ui-state": "needs_input" },
        );
      }
      const r = await sharedToolResult("verify_card", { card }, origin);
      const sc = r.structuredContent ?? { state: "UNCHECKABLE", reason: (r.content[0]?.text ?? "no result").slice(0, 300) };
      return ndjsonResponse(surfaceMessages(verifyResultSurface(sc), version), 200, { ...labels, "x-csoai-a2ui-source": "verify_card", "x-csoai-a2ui-state": String((sc as { state?: unknown }).state ?? "UNCHECKABLE") });
    } catch (e) {
      return Response.json({ error: "a2ui_tool_failed", detail: e instanceof Error ? e.message : String(e) }, { status: 502, headers: cors });
    }
  }

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
