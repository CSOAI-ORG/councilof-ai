/**
 * /mcp — the public MCP endpoint.
 *
 * Mostly a transparent proxy to the GSPC MCP worker. TWO methods are handled here
 * instead of upstream:
 *
 *   tools/call name=verify — the upstream implementation answered
 *     {"valid":false,"reason":"unrecognized card family"} to EVERY card family CSOAI
 *     publishes, including the cross-border card that verifies fine under the published
 *     recipe. It looked for a `content_id` on cards that carry `id`. It is served here
 *     from functions/_lib/cardVerify.ts — the same module the browser verifier at
 *     /gspc-verify uses, so the two surfaces can never disagree again.
 *
 *   tools/call name=measure | jail-probe — the upstream implementations answered
 *     {"ok":true,"claim":"measurement", ...} to EVERY subject, including
 *     "totally-fake-model-zzz-9999" and the empty string, without contacting a model or
 *     consulting the published board. `ok:true` on a measurement tool reads as "measured",
 *     and nothing was. They also carried the sentence "Contact councilof.ai for paid signed
 *     issuance" — a commercial claim on a public surface, in an estate whose rule is that a
 *     grade is never sold. Both are answered here instead, saying plainly that this public
 *     endpoint returns the CONTRACT and performs no measurement, with `measured:false`.
 *
 *   tools/list — the `verify`, `measure` and `jail-probe` descriptions are rewritten to
 *     match what the tools now actually do. A tool description that promises more than the
 *     tool does is the same defect class.
 *
 * Everything else is forwarded untouched.
 */

import { verifyCard, anchorsFromDid, type Anchor } from "../_lib/cardVerify";

const UPSTREAM = "https://csoai-gspc-mcp.nicholastempleman.workers.dev/mcp";

/** Card URLs may be fetched only from the estate's own published origins. */
const FETCHABLE_ORIGINS = ["https://councilof.ai/", "https://csoai.org/", "https://www.csoai.org/"];

const VERIFY_DESCRIPTION =
  "Verify a signed CSOAI card. Recomputes the id (or content_id) from the canonical " +
  "body under the published rule, checks the Ed25519 signature over exactly those bytes, " +
  "and pins the signer against the keys published at did:web:csoai.org. Recognises both " +
  "published families: gspc.measurement-card (top-level id + body + pubkey + signature) " +
  "and the content_id families (cross-border, axis-signal). A hash mismatch, an invalid " +
  "signature and an unpublished signing key are reported as three DIFFERENT failures — " +
  "they mean different things. Accepts the card as an object, as a JSON string, or as a " +
  "councilof.ai / csoai.org URL. Free, anonymous, no account. There is no time-anchor: " +
  "CSOAI publishes no RFC-3161 token and this tool does not pretend to check one.";

const MEASURE_DESCRIPTION =
  "Return the GSPC measurement CONTRACT for a subject: which axes exist, how they are " +
  "graded, and where the published results live. This endpoint DOES NOT MEASURE — it " +
  "contacts no model and grades nothing, so it always answers measured:false. Published " +
  "measurements are at GET /api/gspc (axes) and /signed/card_index.json (signed cards); " +
  "an axis with no card is UNMEASURED and stays UNMEASURED. Never a certification.";

const JAIL_DESCRIPTION =
  "Return the jail-probe verdict CONTRACT for a model and prompt. This endpoint DOES NOT " +
  "RUN the probe — sandbox execution and signed card issuance happen on the measurement " +
  "fleet, not here — so it always answers measured:false and issues no verdict. " +
  "Never a certification.";

/**
 * The honest answer for the two contract-only tools. Three states, never two: this is the
 * third — "not measured", which is neither a pass nor a fail.
 */
function contractOnly(kind: "measure" | "jail-probe", args: Record<string, unknown>) {
  const subject = String(args.model ?? args.subject ?? "");
  const payload = {
    measured: false,
    not_a_certification: true,
    kind: `${kind}.contract`,
    subject: subject || null,
    subject_note: subject
      ? "echoed back as given; it was NOT looked up, contacted, or graded by this endpoint"
      : "no subject was given",
    reason:
      kind === "measure"
        ? "this public endpoint returns the measurement contract only. It contacts no model and grades nothing."
        : "this public endpoint returns the jail-probe verdict contract only. Sandbox execution runs on the measurement fleet, not here.",
    where_measurements_live: {
      axes: "https://councilof.ai/api/gspc",
      signed_cards: "https://councilof.ai/signed/card_index.json",
      how_to_verify: "https://councilof.ai/signed/HOW-TO-VERIFY.md",
    },
  };
  const summary =
    `NOT MEASURED — ${kind} on this endpoint returns the contract, not a measurement. ` +
    (subject ? `Nothing was run against "${subject}".` : "No subject was given.");
  return { content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(payload, null, 2)}` }], structuredContent: payload, isError: false };
}

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

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

function rpc(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, result }, { headers: { ...CORS } });
}

async function loadAnchors(origin: string): Promise<Anchor[]> {
  for (const base of [origin, "https://csoai.org"]) {
    try {
      const r = await fetch(`${base}/.well-known/did.json`, { headers: { accept: "application/json" } });
      if (!r.ok) continue;
      const anchors = anchorsFromDid(await r.json());
      if (anchors.length) return anchors;
    } catch {
      /* try the next source */
    }
  }
  return [];
}

/** Coerce whatever the caller passed into a card object, or explain why we could not. */
async function coerceCard(raw: unknown): Promise<{ card?: unknown; error?: string }> {
  if (raw && typeof raw === "object") return { card: raw };
  if (typeof raw !== "string") {
    return { error: "pass the card as an object, a JSON string, or a councilof.ai / csoai.org URL" };
  }
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) {
    if (!FETCHABLE_ORIGINS.some((o) => s.startsWith(o))) {
      return {
        error:
          "only councilof.ai and csoai.org URLs are fetched by this tool; " +
          "fetch other URLs yourself and pass the JSON",
      };
    }
    try {
      const r = await fetch(s, { headers: { accept: "application/json" } });
      if (!r.ok) return { error: `card fetch returned HTTP ${r.status}` };
      return { card: await r.json() };
    } catch (e) {
      return { error: `card fetch failed: ${(e as Error).message}` };
    }
  }
  try {
    return { card: JSON.parse(s) };
  } catch {
    return { error: "the string is neither valid JSON nor a councilof.ai / csoai.org URL" };
  }
}

async function handleVerify(id: unknown, args: Record<string, unknown>, origin: string) {
  const raw = args.card ?? args.record ?? args.json ?? args.url ?? args.input;
  const { card, error } = await coerceCard(raw);
  if (error) {
    const payload = { valid: false, reason: error, reasons: ["input_not_a_card"] };
    return rpc(id, {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
      isError: false,
    });
  }

  const anchors = await loadAnchors(origin);
  const v = await verifyCard(card, anchors);

  const payload = {
    valid: v.valid,
    family: v.family,
    family_label: v.family_label,
    id: v.id,
    // Distinct machine-readable failure codes. `preimage_mismatch` (the bytes changed)
    // and `untrusted_signer` (the key is not published) are never merged: conflating
    // them is what told an outside auditor a published key was missing.
    reasons: v.reasons,
    checks: v.checks.map((c) => ({ check: c.label, ok: c.ok, code: c.code, detail: c.detail })),
    trust_anchors_consulted: anchors.length
      ? anchors.map((a) => a.id)
      : "did.json unreachable — the signer could not be pinned",
    not_a_certification: true,
    rule: "https://councilof.ai/signed/HOW-TO-VERIFY.md",
  };

  const summary = v.valid
    ? `VALID — ${v.family} ${String(v.id).slice(0, 16)}… reproduces its own id and verifies under a published key.`
    : `NOT VALID — ${v.reasons.join(", ")}`;

  return rpc(id, {
    content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(payload, null, 2)}` }],
    structuredContent: payload,
    isError: false,
  });
}

/** Rewrite the upstream `verify` tool entry so its description matches this handler. */
function patchToolsList(body: unknown): unknown {
  const tools = (body as { result?: { tools?: { name?: string; description?: string; inputSchema?: unknown }[] } })
    ?.result?.tools;
  if (!Array.isArray(tools)) return body;
  for (const t of tools) {
    if (t?.name === "measure") { t.description = MEASURE_DESCRIPTION; continue; }
    if (t?.name === "jail-probe") { t.description = JAIL_DESCRIPTION; continue; }
    if (t?.name !== "verify") continue;
    t.description = VERIFY_DESCRIPTION;
    t.inputSchema = {
      type: "object",
      properties: {
        card: {
          description:
            "The signed card: an object, a JSON string, or a councilof.ai / csoai.org URL to one.",
          anyOf: [{ type: "object" }, { type: "string" }],
        },
      },
      required: ["card"],
    };
  }
  return body;
}

async function proxy(ctx: Parameters<PagesFunction>[0], bodyText: string | null): Promise<Response> {
  const url = new URL(ctx.request.url);
  const subpath = url.pathname.replace(/^\/mcp\/?/, "");
  const target = subpath ? `${UPSTREAM}/${subpath}${url.search}` : `${UPSTREAM}${url.search}`;

  const forwardHeaders = new Headers();
  for (const [k, v] of ctx.request.headers) {
    if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== "host") forwardHeaders.set(k, v);
  }

  const init: RequestInit & { duplex?: string } = {
    method: ctx.request.method,
    headers: forwardHeaders,
  };
  if (bodyText !== null) {
    init.body = bodyText;
  } else if (ctx.request.body) {
    init.body = ctx.request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(target, init as RequestInit);

  const responseHeaders = new Headers();
  for (const [k, v] of upstream.headers) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) responseHeaders.set(k, v);
  }
  for (const [k, v] of Object.entries(CORS)) responseHeaders.set(k, v);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const onRequest: PagesFunction = async (ctx) => {
  if (ctx.request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const origin = new URL(ctx.request.url).origin;

  // Only POSTed JSON-RPC is inspected; everything else streams through untouched.
  let bodyText: string | null = null;
  let call: { method?: string; id?: unknown; params?: { name?: string; arguments?: Record<string, unknown> } } | null =
    null;

  if (ctx.request.method === "POST") {
    try {
      bodyText = await ctx.request.text();
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) call = parsed;
    } catch {
      call = null; // not JSON — proxy the bytes we already read
    }
  }

  try {
    if (call?.method === "tools/call" && call.params?.name === "verify") {
      return await handleVerify(call.id, call.params.arguments ?? {}, origin);
    }

    if (call?.method === "tools/call" && (call.params?.name === "measure" || call.params?.name === "jail-probe")) {
      return rpc(call.id, contractOnly(call.params.name as "measure" | "jail-probe", call.params.arguments ?? {}));
    }

    if (call?.method === "tools/list") {
      const upstream = await proxy(ctx, bodyText);
      try {
        const json = await upstream.clone().json();
        return Response.json(patchToolsList(json), {
          status: upstream.status,
          headers: { ...CORS, "content-type": "application/json" },
        });
      } catch {
        return upstream; // not JSON we can patch — hand back exactly what upstream said
      }
    }

    return await proxy(ctx, bodyText);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return Response.json(
      { error: "mcp upstream unavailable", detail: msg },
      { status: 502, headers: { ...CORS, "content-type": "application/json" } },
    );
  }
};
