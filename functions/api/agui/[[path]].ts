/**
 * /api/agui/* — same-origin proxy to the AG-UI wire on the RunPod agui pod,
 * plus a local living-GSPC stream path for agent-native CouncilOS.
 *
 * Local (no upstream): GET /api/agui/gspc-state
 *   → SSE STATE_DELTA + TEXT_MESSAGE_CONTENT from living GET /api/gspc.
 *   Empty visible. No invented scores. Same GET agents and humans share.
 *
 * Upstream: Set AGUI_WIRE_URL in Cloudflare Pages (e.g. https://agui.councilof.ai
 * or the RunPod tunnel). When unset, non-local paths return 503 with a clear
 * hint — never the SPA shell.
 *
 * The wire implements AG-UI SSE (RUN_*, TEXT_MESSAGE_*, HITL, STATE_DELTA).
 * Council OS consumes this from the lobby thread; consent checkpoints stay visible.
 *
 * AX: agents are first-class on the same living GETs (/api/gspc, /root.json,
 * /api/xrpl). Human UI is thin over those GETs — never a second source of truth.
 */

interface Env {
  AGUI_WIRE_URL?: string;
}

const DEFAULT_WIRE = "http://127.0.0.1:8785";

type AxisSnap = {
  axis: string;
  status: string;
  family?: string;
  kind?: string;
  n: number | null;
  accuracy: number | null;
  separation: string | null;
};

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function livingGspcSse(j: any, endpoint: string): string {
  const axes = Array.isArray(j?.axes) ? j.axes : [];
  const totals = j?.totals && typeof j.totals === "object" ? j.totals : {};
  const measured: AxisSnap[] = [];
  const empty: AxisSnap[] = [];
  for (const row of axes) {
    if (!row || typeof row.axis !== "string") continue;
    const status = typeof row.status === "string" && row.status.trim() ? row.status : "UNMEASURED";
    const snap: AxisSnap = {
      axis: row.axis,
      status,
      family: typeof row.family === "string" ? row.family : undefined,
      kind: typeof row.kind === "string" ? row.kind : undefined,
      n: numOrNull(row.n),
      accuracy: numOrNull(row.accuracy),
      separation: typeof row.separation === "string" ? row.separation : null,
    };
    if (status === "MEASURED") measured.push(snap);
    else empty.push(snap);
  }
  const public_count =
    typeof totals.public_count === "string" && totals.public_count.trim()
      ? totals.public_count.trim()
      : `${axes.length} axis · ${measured.length} measured`;
  const snapshot = {
    schema: "csoai.agui-gspc-snapshot/0.1",
    source: "wire",
    endpoint,
    public_count,
    count_grammar:
      typeof totals.count_grammar === "string" && totals.count_grammar.trim()
        ? totals.count_grammar.trim()
        : "Empty cells stay empty. Cite GET /api/gspc. No invented scores.",
    totals: {
      axes: numOrNull(totals.axes) ?? (axes.length || null),
      measured_axes: numOrNull(totals.measured_axes) ?? measured.length,
      unmeasured_axes: numOrNull(totals.unmeasured_axes) ?? empty.length,
    },
    measured,
    empty,
    note: "AG-UI stream snapshot from living GET /api/gspc. Measurement credential, never certification. Empty visible.",
  };
  const stateDelta = {
    type: "STATE_DELTA",
    delta: [
      { op: "replace", path: "/gspc", value: snapshot },
      { op: "replace", path: "/gspc/public_count", value: snapshot.public_count },
      { op: "replace", path: "/gspc/empty_visible", value: empty.map((a) => a.axis) },
    ],
  };
  const emptyNames = empty.map((a) => a.axis).join(", ") || "(none)";
  const textMsg = {
    type: "TEXT_MESSAGE_CONTENT",
    delta:
      `Live GSPC · ${public_count}. ` +
      `${snapshot.totals.unmeasured_axes ?? empty.length} empty visible: ${emptyNames}. ` +
      `Cite ${endpoint}. Empty stays empty. Not a certificate.`,
  };
  return (
    `event: STATE_DELTA\ndata: ${JSON.stringify(stateDelta)}\n\n` +
    `event: TEXT_MESSAGE_CONTENT\ndata: ${JSON.stringify(textMsg)}\n\n`
  );
}

async function serveLivingGspcState(ctx: EventContext<Env, any, any>): Promise<Response> {
  const origin = new URL(ctx.request.url).origin;
  const endpoint = `${origin}/api/gspc`;
  try {
    const upstream = await fetch(endpoint, { headers: { accept: "application/json" } });
    if (!upstream.ok) {
      return Response.json(
        { error: "gspc_upstream", status: upstream.status, endpoint },
        { status: 502, headers: { "cache-control": "no-store" } },
      );
    }
    const j = await upstream.json();
    if (!j || typeof j !== "object" || !Array.isArray((j as any).axes)) {
      return Response.json(
        { error: "gspc_not_payload", endpoint },
        { status: 502, headers: { "cache-control": "no-store" } },
      );
    }
    const body = livingGspcSse(j, "/api/gspc");
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
        "x-csoai-gspc-source": "living-get",
        "x-csoai-agui": "gspc-state",
      },
    });
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : String(e);
    return Response.json(
      { error: "gspc_fetch_failed", detail, endpoint },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const sub = Array.isArray(ctx.params.path) ? ctx.params.path.join("/") : "";

  // Local living-GSPC stream — no RunPod required. Agents + humans share GET /api/gspc.
  if (sub === "gspc-state" || sub === "gspc/state") {
    if (ctx.request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "accept, content-type",
        },
      });
    }
    if (ctx.request.method !== "GET" && ctx.request.method !== "HEAD") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }
    return serveLivingGspcState(ctx);
  }

  const base = (ctx.env.AGUI_WIRE_URL || DEFAULT_WIRE).replace(/\/$/, "");
  const url = new URL(ctx.request.url);
  const target = `${base}/${sub}${url.search}`;

  if (!ctx.env.AGUI_WIRE_URL && ctx.request.method !== "OPTIONS") {
    return Response.json(
      {
        error: "agui_wire_unconfigured",
        hint: "Set AGUI_WIRE_URL on Cloudflare Pages to the RunPod AG-UI wire (port 8785). Or GET /api/agui/gspc-state for living GSPC STATE_DELTA without the wire.",
        path: `/api/agui/${sub}`,
        living_gspc: "/api/agui/gspc-state",
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
