/**
 * /mcp proxy — forwards MCP requests to the GSPC MCP worker.
 * Handles POST initialize, tools/list, tools/call, etc.
 * No Authorization required; public MCP endpoint.
 *
 * ── ONE CORRECTION IS APPLIED HERE, NOT FORWARDED (2026-08-26) ────────────────
 * Upstream's `measure` tool returns `{"ok": true, …}` for EVERY subject, including
 * subjects that do not exist:
 *
 *   measure(model="THIS-MODEL-DOES-NOT-EXIST-xyz")
 *     -> {"ok":true,"claim":"measurement","subject":"THIS-MODEL-DOES-NOT-EXIST-xyz",
 *         "note":"issuance is metered and signed on the keystone; this public endpoint
 *                 returns the measurement contract…"}
 *
 * No measurement runs, no axes are returned, no credential is issued — and it says
 * ok:true regardless. A measurement tool that succeeds on a nonexistent subject
 * cannot distinguish "measured" from "did nothing", which is precisely what
 * /api/mcp's own honesty_contract forbids: "Unknown is null or 'unmeasured'. It is
 * never a plausible-looking value." (outside audit P1.)
 *
 * The upstream worker's source is not in this repository, so it is corrected at the
 * published address instead: councilof.ai/mcp is the endpoint named in
 * /.well-known/mcp.json, /.well-known/agent-card.json and the audit, and this is the
 * handler in front of it. `measure` is answered HERE and never forwarded, and its
 * description in tools/list is rewritten to what the endpoint actually does. Every
 * other method and every other tool passes through untouched, byte for byte.
 *
 * This is a shim over an upstream that is still wrong at its own workers.dev origin.
 * Tracked as /api/corrections C-2026-0826-11; the durable fix is in the worker.
 */

const UPSTREAM = "https://csoai-gspc-mcp.nicholastempleman.workers.dev/mcp";

/** What `measure` at this public endpoint actually does — no measurement, ever. */
const MEASURE_DESCRIPTION =
  "Returns the GSPC measurement CONTRACT for a subject. It does NOT run a measurement, " +
  "does NOT check that the subject exists, and NEVER returns a credential: it always " +
  "returns ok:false with a reason. Published measurements live in /signed/card_index.json " +
  "(150 Ed25519-signed cards) and GET /api/gspc; measurement itself is arranged at " +
  "councilof.ai/get-measured. Measurement, never certification.";

/** The distinct failure states. `ok` is never true here, because nothing ever succeeds here. */
function measureResult(args: Record<string, unknown> | undefined) {
  const raw = args?.model;
  const subject = typeof raw === "string" ? raw.trim() : "";

  const common = {
    ok: false as const,
    measured: false as const,
    claim: "none",
    not_a_certification: true,
    published_measurements: [
      "https://councilof.ai/signed/card_index.json",
      "https://councilof.ai/api/gspc",
    ],
    route: "https://councilof.ai/get-measured",
  };

  if (!subject) {
    return {
      ...common,
      state: "INVALID_ARGUMENT",
      subject: null,
      reason:
        "no subject given: `model` is required and must be a non-empty string. Nothing was " +
        "measured and nothing was looked up.",
    };
  }

  return {
    ...common,
    state: "NOT_MEASURED",
    subject,
    subject_state: "UNVERIFIED",
    reason:
      "not measured here. This public endpoint returns the measurement contract and runs no " +
      "measurement, so it has no result for this or any subject.",
    subject_note:
      "This endpoint did not check whether `" +
      subject +
      "` exists, and says so rather than implying it did. Until 2026-08-26 this tool returned " +
      "ok:true for every string passed to it, including subjects that do not exist. To find out " +
      "whether a subject already carries a published measurement, look it up in " +
      "/signed/card_index.json (each card's body carries its `model`) or in /api/gspc.",
  };
}

const jsonRpcResult = (id: unknown, payload: unknown) =>
  Response.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      result: { content: [{ type: "text", text: JSON.stringify(payload) }] },
    },
    {
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    }
  );

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

  // ── the `measure` correction (see header) ───────────────────────────────────
  // Only POSTs with a JSON body are inspected, and only two shapes are touched:
  // tools/call for `measure`, and tools/list (to rewrite one description). If the
  // body cannot be read or parsed, nothing is intercepted and the original request
  // is forwarded unchanged — a parse failure must never become a silent rewrite.
  let bodyText: string | null = null;
  let rpc: { id?: unknown; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } } | null =
    null;
  if (ctx.request.method === "POST") {
    try {
      bodyText = await ctx.request.text();
      rpc = JSON.parse(bodyText);
    } catch {
      rpc = null;
    }
  }

  if (rpc?.method === "tools/call" && rpc?.params?.name === "measure") {
    return jsonRpcResult(rpc.id, measureResult(rpc.params.arguments));
  }

  // We re-send a buffered body; let fetch recompute its length rather than
  // forwarding a stale content-length from the original request.
  if (bodyText !== null) forwardHeaders.delete("content-length");

  try {
    const upstream = await fetch(target, {
      method: ctx.request.method,
      headers: forwardHeaders,
      // Re-send the body we buffered when we had to read it; otherwise stream as before.
      body: bodyText !== null ? bodyText : ctx.request.body,
      // @ts-expect-error — duplex required for streaming request bodies
      duplex: "half",
    });

    // tools/list: correct `measure`'s description in place. A tool that returns an
    // honest ok:false in front of a description promising "a signed measurement
    // credential" would just move the contradiction one field to the left.
    if (
      rpc?.method === "tools/list" &&
      upstream.ok &&
      (upstream.headers.get("content-type") || "").includes("json")
    ) {
      try {
        const listed = (await upstream.clone().json()) as {
          result?: { tools?: { name: string; description?: string }[] };
        };
        const tools = listed?.result?.tools;
        if (Array.isArray(tools)) {
          for (const t of tools) if (t?.name === "measure") t.description = MEASURE_DESCRIPTION;
          return Response.json(listed, {
            headers: {
              "access-control-allow-origin": "*",
              "access-control-allow-methods": "GET, POST, OPTIONS",
              "access-control-allow-headers": "content-type",
              "cache-control": "no-store",
            },
          });
        }
      } catch {
        // Upstream returned something this rewrite does not understand. Fall through
        // and pass it along untouched rather than dropping or inventing a catalogue.
      }
    }

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
