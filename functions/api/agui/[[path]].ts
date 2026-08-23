/**
 * /api/agui/* — same-origin proxy to the AG-UI wire on the RunPod agui pod.
 *
 * Set AGUI_WIRE_URL in Cloudflare Pages (e.g. https://agui.councilof.ai or the
 * RunPod tunnel). When unset, returns 503 with a clear hint — never the SPA shell.
 *
 * The wire implements AG-UI SSE (RUN_*, TEXT_MESSAGE_*, HITL, STATE_DELTA).
 * Council OS consumes this from the lobby thread; consent checkpoints stay visible.
 */

interface Env {
  AGUI_WIRE_URL?: string;
}

const DEFAULT_WIRE = "http://127.0.0.1:8785";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const base = (ctx.env.AGUI_WIRE_URL || DEFAULT_WIRE).replace(/\/$/, "");
  const sub = Array.isArray(ctx.params.path) ? ctx.params.path.join("/") : "";
  const url = new URL(ctx.request.url);
  const target = `${base}/${sub}${url.search}`;

  if (!ctx.env.AGUI_WIRE_URL && ctx.request.method !== "OPTIONS") {
    return Response.json(
      {
        error: "agui_wire_unconfigured",
        hint: "Set AGUI_WIRE_URL on Cloudflare Pages to the RunPod AG-UI wire (port 8785).",
        path: `/api/agui/${sub}`,
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const headers = new Headers(ctx.request.headers);
    headers.delete("host");
    const upstream = await fetch(target, {
      method: ctx.request.method,
      headers,
      body: ctx.request.method === "GET" || ctx.request.method === "HEAD" ? undefined : ctx.request.body,
      redirect: "manual",
    });

    const out = new Headers(upstream.headers);
    out.set("access-control-allow-origin", "*");
    out.set("cache-control", "no-store");

    return new Response(upstream.body, { status: upstream.status, headers: out });
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : String(e);
    return Response.json(
      { error: "agui_upstream_unavailable", detail, target },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
};
