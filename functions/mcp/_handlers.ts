/**
 * Shared MCP tool handlers for Pages /mcp.
 * Free definitions stay in ./gspc-tools.json. /mcp serves them plus the paid tools in
 * ./paid-tools.json; /mcp/free serves them alone. witness_hash stays quarantined. npm is an
 * independent release: ask that installed implementation for its current tools/list.
 */
import { verifyCard, anchorsFromDid, cardState, type Anchor } from "../_lib/cardVerify";
import GSPC_TOOLS from "./gspc-tools.json";
import {
  CARD_ID_RE,
  FETCHABLE_ORIGINS,
  UPSTREAM,
  signedCardPath,
  boardTotalsTool,
  getAxisTool,
  listCardsTool,
  getRootTool,
  getCardTool,
  x402TrustTool,
  mcpTrustTool,
  verifyInclusionTool,
} from "./_board";

export { UPSTREAM };

export type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError: boolean;
};

/**
 * verify_card — the shared three-state verdict (VALID / INVALID+reason /
 * UNCHECKABLE), same contract as the stdio server. Runs on cardVerify, the same
 * module as the `verify` tool and /gspc-verify, so the verdict can never
 * disagree with those surfaces; the summary shape matches the stdio tool.
 */
async function verifyCardThreeState(
  args: Record<string, unknown>,
  origin: string,
) {
  const raw = args.card ?? args.record ?? args.json ?? args.url ?? args.input;
  const { card, error, resolved } = await coerceCard(raw, origin);
  if (error) {
    return {
      state: "UNCHECKABLE",
      reason: error,
      ...(resolved ? { resolved_from: resolved } : {}),
      not_a_certification: true,
    };
  }
  // The deciding trust anchors are pinned inside cardVerify (PINNED_ANCHORS), so an
  // unreachable did.json no longer makes the verdict UNCHECKABLE — verification
  // succeeds for a party holding the record and this code, with no key resolution at
  // check time. The live fetch feeds only the labelled cross-check row.
  const anchors = await loadAnchors(origin);
  const v = await verifyCard(card, anchors);
  const c = card as Record<string, unknown>;
  const mismatch = idMismatch(resolved, v.id ?? c?.id);
  const state = mismatch ? "UNCHECKABLE" : cardState(v.valid, v.reasons);
  const reasons = mismatch ? [...v.reasons, "id_mismatch_with_request"] : v.reasons;
  return {
    state,
    id: v.id ?? c?.id ?? null,
    ...(resolved ? { resolved_from: resolved } : {}),
    family: v.family ?? null,
    reason: mismatch ?? (v.valid ? null : v.reasons.join(", ")),
    reasons,
    checks: v.checks.map((ch) => ({
      check: ch.label,
      ok: ch.ok,
      code: ch.code,
      detail: ch.detail,
      ...(ch.advisory ? { advisory: true } : {}),
    })),
    rule: `${origin}/signed/HOW-TO-VERIFY.md`,
    // The anchor the Trust anchor check actually matched — never a typed key id. A card signed under
    // board-attestation-1 used to be labelled card-attestation-1 here (2026-09-15).
    pinned_key: v.anchor_id ?? null,
    not_a_certification: true,
    note: state === "VALID"
      ? "The body reproduces its own id and the signature verifies under a published key. This is a verified measurement card — not a certification of anything."
      : state === "UNCHECKABLE"
        ? "The check could not be completed for the stated reason. UNCHECKABLE is not INVALID: nothing was judged."
        : "This card fails the published rule for the stated reason. INVALID is a positive finding, distinct from UNCHECKABLE.",
  };
}

function sharedToolSummary(
  name: string,
  payload: Record<string, unknown>,
): string {
  const idx = payload.index as Record<string, unknown> | null;
  if (payload.state === "UNREACHABLE" || (idx && idx.state === "UNREACHABLE"))
    return "UNREACHABLE — the live source could not be fetched; no cached number is substituted.";
  switch (name) {
    case "board_totals": {
      const sep = payload.separation as Record<string, unknown> | undefined;
      return `LIVE board totals — ${payload.public_count ?? "see counts"} (slots and measurements are different kinds; never summed).${
        sep && typeof sep.public_count === "string" ? ` Separation: ${sep.public_count}.` : ""
      }`;
    }
    case "get_axis":
      return payload.state === "NOT_ON_BOARD"
        ? `NOT ON BOARD — "${payload.axis}" is not a row the live board carries.`
        : `${payload.status ?? "?"} — axis "${payload.axis}" (${payload.measured ? "a real run stands behind this row" : "declared slot, no run behind it"}).`;
    case "verify_card":
      return `${payload.state}${payload.reason ? " — " + payload.reason : ""}${payload.state === "VALID" ? ` — ${String(payload.id).slice(0, 16)}… verifies under the published key.` : ""}`;
    case "list_cards": {
      const store = payload.card_store_count_endpoint as Record<
        string,
        unknown
      > | null;
      return `index declares ${idx?.n_cards_declared ?? "?"} card rows; the store's count endpoint reports ${store?.count ?? "?"}. Two labelled numbers, not reconciled here.`;
    }
    case "get_root":
      return `${payload.state ?? "?"} — public-root merkle ${String(payload.merkle_root || "").slice(0, 16) || "none"}. Not GSPC.`;
    case "get_card":
      // The reason leads when there is one: NOT_IN_THIS_CORPUS has to say where the id IS.
      return payload.reason
        ? `${payload.state ?? "?"} — ${payload.reason}`
        : `${payload.state ?? "?"} — card-v0 leaf ${String(payload.sha256 || "").slice(0, 16) || "?"}.`;
    case "verify_inclusion":
      return `${payload.state ?? "?"} — inclusion against live merkle.`;
    case "x402_trust":
      return `${payload.state ?? "?"} — ${(payload.headline as string) || "catalog trust counts"}.`;
    case "mcp_trust":
      return `${payload.state ?? "?"} — MCP handshake census${payload.partial ? " (partial round)" : ""}.`;
    case "claim_reactions":
      return payload.state === "LIVE"
        ? `LIVE verified claim-reaction projection — ${payload.n_events ?? 0} event(s); freshness is ${payload.evidence_freshness ?? "not evaluated"}. No action is executed.`
        : `${payload.state ?? "UNREACHABLE"} — claim-reaction projection is unavailable; no cached result is substituted.`;
    default:
      return name;
  }
}

export const SHARED_TOOL_NAMES = new Set(
  (GSPC_TOOLS as { tools: { name: string }[] }).tools.map((t) => t.name),
);

export async function sharedToolResult(
  name: string,
  args: Record<string, unknown>,
  origin: string,
): Promise<McpToolResult> {
  const payload =
    name === "board_totals"
      ? await boardTotalsTool(origin, args)
      : name === "get_axis"
        ? await getAxisTool(origin, args)
        : name === "list_cards"
          ? await listCardsTool(origin, args)
          : name === "get_root"
            ? await getRootTool(origin)
            : name === "get_card"
              ? await getCardTool(origin, args)
              : name === "verify_inclusion"
                ? await verifyInclusionTool(origin, args)
                : name === "x402_trust"
                  ? await x402TrustTool(origin)
                : name === "mcp_trust"
                  ? await mcpTrustTool(origin)
                  : name === "claim_reactions"
                    ? await claimReactionsTool(args, origin)
                    : await verifyCardThreeState(args, origin);
  const isError = (payload as Record<string, unknown>).state === "UNREACHABLE" ||
    (payload as Record<string, unknown>).state === "BAD_INPUT";
  return {
    content: [
      {
        type: "text",
        text: `${sharedToolSummary(name, payload as Record<string, unknown>)}\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    structuredContent: payload,
    isError,
  } as McpToolResult;
}

/**
 * Read the same verified HTTP projection served to the human dashboard. This adapter does not
 * recompute, admit, recheck, sign, anchor, publish, or pay; it only transports one existing record.
 */
async function claimReactionsTool(args: Record<string, unknown>, origin: string) {
  const rawSince = args.since;
  const since = rawSince === undefined ? -1 : rawSince;
  if (typeof since !== "number" || !Number.isInteger(since) || since < -1) {
    return { state: "BAD_INPUT", error: "since must be an integer event sequence >= -1" };
  }
  const url = new URL("/api/claims/reactions", origin);
  if (since !== -1) url.searchParams.set("since", String(since));
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok || payload.state !== "LIVE" || payload.schema !== "csoai.claim-reactions/0.1" || payload.source_verification !== "VERIFIES") {
      return { state: "UNREACHABLE", error: "reaction_projection_not_verified", http_status: response.status, observed_state: payload.state ?? null };
    }
    return payload;
  } catch {
    return { state: "UNREACHABLE", error: "reaction_projection_unreachable" };
  }
}

export async function handleSharedTool(
  id: unknown,
  name: string,
  args: Record<string, unknown>,
  origin: string,
): Promise<Response> {
  return rpc(id, await sharedToolResult(name, args, origin));
}

export const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

/** Legacy JSON-RPC wrapper. Protocol negotiation belongs to the request handler. */
export function rpc(id: unknown, result: unknown) {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, result },
    { headers: { ...CORS } },
  );
}

async function loadAnchors(origin: string): Promise<Anchor[]> {
  for (const base of [origin, "https://csoai.org"]) {
    try {
      const r = await fetch(`${base}/.well-known/did.json`, {
        headers: { accept: "application/json" },
      });
      if (!r.ok) continue;
      const anchors = anchorsFromDid(await r.json());
      if (anchors.length) return anchors;
    } catch {
      /* try the next source */
    }
  }
  return [];
}

/**
 * Coerce whatever the caller passed into a card object, or explain why we could not.
 *
 * A BARE 64-HEX ID is a card id (2026-09-28, public audit fix #4). It is the "record id" the home
 * page shows and the `card` field of every signed-card-index row, so it is the first thing a
 * person pastes — and it used to come back UNCHECKABLE ("neither valid JSON nor a URL"), with the
 * first success only on the fourth call. It resolves to the signed body at
 * {origin}/signed/cards/{id}.json. `resolved` names what was fetched, so the verdict can be held
 * to the id that was asked about.
 */
export async function coerceCard(
  raw: unknown,
  origin = "https://councilof.ai",
): Promise<{ card?: unknown; error?: string; resolved?: { id: string; url: string } }> {
  if (raw && typeof raw === "object") return { card: raw };
  if (typeof raw !== "string") {
    return {
      error:
        "pass the card as an object, a JSON string, a councilof.ai / csoai.org URL, or a 64-hex card id",
    };
  }
  const s = raw.trim();
  if (CARD_ID_RE.test(s.toLowerCase())) {
    const id = s.toLowerCase();
    const url = `${origin}${signedCardPath(id)}`;
    try {
      const r = await fetch(url, { headers: { accept: "application/json" } });
      if (r.status === 404) {
        return {
          error:
            `no signed card body at ${url} (HTTP 404): this id is not in the signed card index. ` +
            "If it is a public-root leaf, use get_card or verify_inclusion.",
          resolved: { id, url },
        };
      }
      if (!r.ok) return { error: `card fetch returned HTTP ${r.status} for ${url}`, resolved: { id, url } };
      return { card: await r.json(), resolved: { id, url } };
    } catch (e) {
      return { error: `card fetch failed for ${url}: ${(e as Error).message}`, resolved: { id, url } };
    }
  }
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
    return {
      error:
        "the string is neither valid JSON, a councilof.ai / csoai.org URL, nor a 64-hex card id",
    };
  }
}

/**
 * A card fetched by id must BE that id. A file served under one id that carries another would
 * otherwise return a VALID verdict about a card nobody asked about; that is UNCHECKABLE for the
 * id requested (nothing was judged about it), never VALID and never INVALID.
 */
function idMismatch(resolved: { id: string; url: string } | undefined, verifiedId: unknown): string | null {
  if (!resolved || typeof verifiedId !== "string" || verifiedId === resolved.id) return null;
  return `the file at ${resolved.url} carries id ${verifiedId}, not the requested ${resolved.id}`;
}

export async function verifyToolResult(
  args: Record<string, unknown>,
  origin: string,
): Promise<McpToolResult> {
  const raw = args.card ?? args.record ?? args.json ?? args.url ?? args.input;
  const { card, error, resolved } = await coerceCard(raw, origin);
  if (error) {
    const payload = {
      valid: false,
      state: "UNCHECKABLE",
      reason: error,
      reasons: ["input_not_a_card"],
      ...(resolved ? { resolved_from: resolved } : {}),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
      isError: false,
    };
  }

  const anchors = await loadAnchors(origin);
  const v = await verifyCard(card, anchors);
  const mismatch = idMismatch(resolved, v.id);
  const state = mismatch ? "UNCHECKABLE" : cardState(v.valid, v.reasons);
  const reasons = mismatch ? [...v.reasons, "id_mismatch_with_request"] : v.reasons;

  const payload = {
    valid: mismatch ? false : v.valid,
    state,
    family: v.family,
    family_label: v.family_label,
    id: v.id,
    ...(resolved ? { resolved_from: resolved } : {}),
    // Distinct machine-readable failure codes. `preimage_mismatch` (the bytes changed)
    // and `untrusted_signer` (the key is not published) are never merged: conflating
    // them is what told an outside auditor a published key was missing.
    reasons,
    checks: v.checks.map((c) => ({
      check: c.label,
      ok: c.ok,
      code: c.code,
      detail: c.detail,
      ...(c.advisory ? { advisory: true } : {}),
    })),
    trust_anchor:
      "pinned in the verifier's source (functions/_lib/cardVerify.ts PINNED_ANCHORS) — no key resolution at check time",
    live_did_crosscheck: anchors.length
      ? anchors.map((a) => a.id)
      : "did.json unreachable — cross-check skipped; the verdict is unaffected",
    not_a_certification: true,
    rule: "https://councilof.ai/signed/HOW-TO-VERIFY.md",
  };

  const summary =
    state === "VALID"
      ? `VALID — ${v.family} ${String(v.id).slice(0, 16)}… reproduces its own id and verifies under a published key.`
      : state === "UNCHECKABLE"
        ? `UNCHECKABLE — ${mismatch ?? reasons.join(", ")} — nothing was judged; this is not a finding that the card is forged.`
        : `INVALID — ${v.reasons.join(", ")}`;

  return {
    content: [
      {
        type: "text",
        text: `${summary}\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    structuredContent: payload,
    isError: false,
  };
}

export async function handleVerify(
  id: unknown,
  args: Record<string, unknown>,
  origin: string,
) {
  return rpc(id, await verifyToolResult(args, origin));
}
