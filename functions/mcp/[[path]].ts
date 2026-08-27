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
// The ONE tool-definition source, shared byte-for-byte with the stdio server
// (mcp/gspc-server — npm: csoai-gspc-mcp). Neither surface defines these four
// tools anywhere else, so the two cannot drift.
import GSPC_TOOLS from "./gspc-tools.json";

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

/* ------------------------------------------------------------------------------
 * The four shared GSPC tools — board_totals, get_axis, verify_card, list_cards.
 * Definitions come from ./gspc-tools.json (the ONE source, shared with the stdio
 * server in mcp/gspc-server); the handlers below mirror mcp/gspc-server/index.mjs
 * shape-for-shape so a client can switch transports without re-learning anything.
 * ---------------------------------------------------------------------------- */

async function fetchOriginJson(origin: string, path: string): Promise<unknown> {
  const r = await fetch(`${origin}${path}`, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET ${origin}${path} returned HTTP ${r.status}`);
  return r.json();
}

/** The distinct unreachable state — never a cached number presented as live. */
function unreachablePayload(origin: string, path: string, e: unknown) {
  return {
    state: "UNREACHABLE",
    reachable: false,
    source: `${origin}${path}`,
    error: e instanceof Error ? e.message : String(e),
    attempted_at: new Date().toISOString(),
    note:
      "The live source could not be fetched. No cached or remembered number is " +
      "substituted — an unreachable board is a different claim from any count.",
  };
}

async function boardTotalsTool(origin: string) {
  let d: Record<string, unknown>;
  try {
    d = (await fetchOriginJson(origin, "/api/gspc")) as Record<string, unknown>;
  } catch (e) {
    return unreachablePayload(origin, "/api/gspc", e);
  }
  const t = (d.totals ?? {}) as Record<string, unknown>;
  return {
    state: "LIVE",
    reachable: true,
    kind: "live-board-totals",
    source: `${origin}/api/gspc`,
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    counts: [
      {
        name: "axis_slots",
        value: t.axes ?? null,
        kind: "declared slot count — a slot is a position on the board, not evidence anything was measured",
      },
      {
        name: "measured",
        value: t.measured_axes ?? null,
        kind: "measurement count — slots with a real run behind them",
      },
      {
        name: "unmeasured",
        value: t.unmeasured_axes ?? null,
        kind: "declared slots with no run behind them — published so the gap is visible; first-class, not an error",
      },
    ],
    count_grammar: t.count_grammar ?? null,
    public_count: t.public_count ?? null,
    by_family: t.by_family ?? null,
    not_a_certification: true,
  };
}

async function getAxisTool(origin: string, args: Record<string, unknown>) {
  const wanted = String(args.axis ?? "").trim().toLowerCase();
  if (!wanted) return { state: "BAD_INPUT", error: "pass an axis name, e.g. governance" };
  let d: Record<string, unknown>;
  try {
    d = (await fetchOriginJson(origin, "/api/gspc")) as Record<string, unknown>;
  } catch (e) {
    return unreachablePayload(origin, "/api/gspc", e);
  }
  const rows = (d.axes ?? []) as Record<string, unknown>[];
  const row = rows.find((r) => String(r.axis ?? "").toLowerCase() === wanted);
  if (!row) {
    return {
      state: "NOT_ON_BOARD",
      axis: wanted,
      note: "This name is not a row on the live board. That is a fact about the board, not a verdict about the subject.",
      board_carries: rows.map((r) => r.axis),
      as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    };
  }
  const measured = String(row.status ?? "").toUpperCase() === "MEASURED";
  return {
    state: "LIVE",
    axis: row.axis,
    family: row.family ?? null,
    status: row.status ?? null,
    measured,
    measured_note: measured
      ? "a real run stands behind this row"
      : "a declared slot with no run behind it — published so the gap is visible; first-class, not an error and not a zero",
    n: row.n ?? null,
    accuracy: row.accuracy ?? null,
    interval: row.interval ?? null,
    leader: row.leader ?? null,
    dataset: row.dataset ?? null,
    note: row.note ?? null,
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    source: `${origin}/api/gspc`,
    not_a_certification: true,
  };
}

async function listCardsTool(origin: string, args: Record<string, unknown>) {
  const out: Record<string, unknown> = {
    doctrine:
      "Two labelled numbers from two surfaces, reported separately and never reconciled by this tool. If they disagree, the disagreement is the finding.",
    index: null,
    card_store_count_endpoint: null,
    rows: null,
    not_a_certification: true,
  };
  try {
    const idx = (await fetchOriginJson(origin, "/signed/card_index.json")) as Record<string, unknown>;
    const rows = (Array.isArray(idx.cards) ? idx.cards : []) as Record<string, unknown>[];
    out.index = {
      source: `${origin}/signed/card_index.json`,
      n_cards_declared: idx.n_cards ?? null,
      rows_carried: rows.length,
      head: idx.head ?? null,
      packaged_at: idx.packaged_at ?? null,
      pubkey: idx.pubkey ?? null,
    };
    const wanted = args.axis ? String(args.axis).toLowerCase() : null;
    const limit = Number.isInteger(args.limit) ? (args.limit as number) : 10;
    out.rows = rows
      .filter((r) => !wanted || String(r.axis ?? "").toLowerCase() === wanted)
      .slice()
      .sort((a, b) => String(b.ts ?? "").localeCompare(String(a.ts ?? "")))
      .slice(0, limit)
      .map((r) => ({ card: r.card, axis: r.axis, ts: r.ts, signed: r.signed }));
  } catch (e) {
    out.index = unreachablePayload(origin, "/signed/card_index.json", e);
  }
  try {
    const api = (await fetchOriginJson(origin, "/api/cards")) as {
      cards?: { count?: number; signed?: number };
    };
    out.card_store_count_endpoint = {
      source: `${origin}/api/cards`,
      count: api?.cards?.count ?? null,
      signed: api?.cards?.signed ?? null,
    };
  } catch (e) {
    out.card_store_count_endpoint = unreachablePayload(origin, "/api/cards", e);
  }
  return out;
}

/**
 * verify_card — the shared three-state verdict (VALID / INVALID+reason /
 * UNCHECKABLE), same contract as the stdio server. Runs on cardVerify, the same
 * module as the `verify` tool and /gspc-verify, so the verdict can never
 * disagree with those surfaces; the summary shape matches the stdio tool.
 */
async function verifyCardThreeState(args: Record<string, unknown>, origin: string) {
  const raw = args.card ?? args.record ?? args.json ?? args.url ?? args.input;
  const { card, error } = await coerceCard(raw);
  if (error) {
    return { state: "UNCHECKABLE", reason: error, not_a_certification: true };
  }
  // The deciding trust anchors are pinned inside cardVerify (PINNED_ANCHORS), so an
  // unreachable did.json no longer makes the verdict UNCHECKABLE — verification
  // succeeds for a party holding the record and this code, with no key resolution at
  // check time. The live fetch feeds only the labelled cross-check row.
  const anchors = await loadAnchors(origin);
  const v = await verifyCard(card, anchors);
  const c = card as Record<string, unknown>;
  return {
    state: v.valid ? "VALID" : "INVALID",
    id: v.id ?? c?.id ?? null,
    family: v.family ?? null,
    reason: v.valid ? null : v.reasons.join(", "),
    reasons: v.reasons,
    checks: v.checks.map((ch) => ({ check: ch.label, ok: ch.ok, code: ch.code, detail: ch.detail })),
    rule: `${origin}/signed/HOW-TO-VERIFY.md`,
    pinned_key: "did:web:csoai.org#card-attestation-1",
    not_a_certification: true,
    note: v.valid
      ? "The body reproduces its own id and the signature verifies under a published key. This is a verified measurement card — not a certification of anything."
      : "This card fails the published rule for the stated reason. INVALID is a positive finding, distinct from UNCHECKABLE.",
  };
}

function sharedToolSummary(name: string, payload: Record<string, unknown>): string {
  const idx = payload.index as Record<string, unknown> | null;
  if (payload.state === "UNREACHABLE" || (idx && idx.state === "UNREACHABLE"))
    return "UNREACHABLE — the live source could not be fetched; no cached number is substituted.";
  switch (name) {
    case "board_totals":
      return `LIVE board totals — ${payload.public_count ?? "see counts"} (slots and measurements are different kinds; never summed).`;
    case "get_axis":
      return payload.state === "NOT_ON_BOARD"
        ? `NOT ON BOARD — "${payload.axis}" is not a row the live board carries.`
        : `${payload.status ?? "?"} — axis "${payload.axis}" (${payload.measured ? "a real run stands behind this row" : "declared slot, no run behind it"}).`;
    case "verify_card":
      return `${payload.state}${payload.reason ? " — " + payload.reason : ""}${payload.state === "VALID" ? ` — ${String(payload.id).slice(0, 16)}… verifies under the published key.` : ""}`;
    case "list_cards": {
      const store = payload.card_store_count_endpoint as Record<string, unknown> | null;
      return `index declares ${idx?.n_cards_declared ?? "?"} card rows; the store's count endpoint reports ${store?.count ?? "?"}. Two labelled numbers, not reconciled here.`;
    }
    default:
      return name;
  }
}

const SHARED_TOOL_NAMES = new Set(
  (GSPC_TOOLS as { tools: { name: string }[] }).tools.map((t) => t.name),
);

async function handleSharedTool(
  id: unknown,
  name: string,
  args: Record<string, unknown>,
  origin: string,
): Promise<Response> {
  const payload =
    name === "board_totals"
      ? await boardTotalsTool(origin)
      : name === "get_axis"
        ? await getAxisTool(origin, args)
        : name === "list_cards"
          ? await listCardsTool(origin, args)
          : await verifyCardThreeState(args, origin);
  return rpc(id, {
    content: [
      {
        type: "text",
        text: `${sharedToolSummary(name, payload as Record<string, unknown>)}\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    structuredContent: payload,
    isError: false,
  });
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
    trust_anchor: "pinned in the verifier's source (functions/_lib/cardVerify.ts PINNED_ANCHORS) — no key resolution at check time",
    live_did_crosscheck: anchors.length
      ? anchors.map((a) => a.id)
      : "did.json unreachable — cross-check skipped; the verdict is unaffected",
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
  // Append the four shared GSPC tools (board_totals, get_axis, verify_card,
  // list_cards) from gspc-tools.json — the same definitions the stdio server
  // serves, so the two transports list identical contracts.
  const present = new Set(tools.map((t) => t?.name));
  for (const t of (GSPC_TOOLS as { tools: { name: string }[] }).tools) {
    if (!present.has(t.name)) tools.push(t as (typeof tools)[number]);
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

  // A plain GET /mcp used to proxy the upstream's 404 — so the very link llms.txt
  // hands to agents answered "not found" unless they already knew to POST. Answer
  // browsers and probes with a discovery document instead. An SSE-capable MCP
  // client asking for an event stream is still proxied untouched.
  {
    const url = new URL(ctx.request.url);
    const isRoot = url.pathname.replace(/\/+$/, "") === "/mcp";
    const wantsSse = (ctx.request.headers.get("accept") ?? "").includes("text/event-stream");
    if ((ctx.request.method === "GET" || ctx.request.method === "HEAD") && isRoot && !wantsSse) {
      return Response.json(
        {
          ok: true,
          protocol: "MCP (JSON-RPC 2.0). POST this URL: initialize -> tools/list -> tools/call.",
          transport: "streamable-http",
          server: "csoai-gspc-mcp",
          doctrine:
            "We measure, never certify. Verdicts are three-state (VALID / INVALID / UNCHECKABLE). An unmeasured axis is a first-class answer. This GET is a discovery document, not the protocol.",
          stdio_alternative:
            "node mcp/gspc-server/index.mjs from https://github.com/CSOAI-ORG/councilof-ai (package csoai-gspc-mcp) — same four board/card tools, one shared definitions file.",
          board: `${origin}/api/gspc`,
          signed_cards: `${origin}/signed/card_index.json`,
          how_to_verify: `${origin}/signed/HOW-TO-VERIFY.md`,
          registry_evidence: "evidence/mcp-registry.json in the repo — probed, never asserted",
        },
        { headers: { ...CORS, "cache-control": "public, max-age=300" } },
      );
    }
  }

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

    if (call?.method === "tools/call" && call.params?.name && SHARED_TOOL_NAMES.has(call.params.name)) {
      return await handleSharedTool(call.id, call.params.name, call.params.arguments ?? {}, origin);
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
