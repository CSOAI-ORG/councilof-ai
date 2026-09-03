/**
 * Shared MCP tool handlers for Pages /mcp.
 * Definitions stay in ./gspc-tools.json (byte-for-byte with npm csoai-gspc-mcp).
 * npm csoai-gspc-mcp@0.1.0 is four tools; HTTP and source 0.1.1 are seven.
 */
import { verifyCard, anchorsFromDid, type Anchor } from "../_lib/cardVerify";
import GSPC_TOOLS from "./gspc-tools.json";
import {
  FETCHABLE_ORIGINS,
  UPSTREAM,
  boardTotalsTool,
  getAxisTool,
  listCardsTool,
  getRootTool,
  getCardTool,
  verifyInclusionTool,
} from "./_board";

export { UPSTREAM };

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
    case "get_root":
      return `${payload.state ?? "?"} — public-root merkle ${(String(payload.merkle_root || "")).slice(0, 16) || "none"}. Not GSPC.`;
    case "get_card":
      return `${payload.state ?? "?"} — card-v0 leaf ${String(payload.sha256 || "").slice(0, 16) || "?"}.`;
    case "verify_inclusion":
      return `${payload.state ?? "?"} — inclusion against live merkle.`;
    default:
      return name;
  }
}

export const SHARED_TOOL_NAMES = new Set(
  (GSPC_TOOLS as { tools: { name: string }[] }).tools.map((t) => t.name),
);

export async function handleSharedTool(
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
          : name === "get_root"
            ? await getRootTool(origin)
            : name === "get_card"
              ? await getCardTool(origin, args)
              : name === "verify_inclusion"
                ? await verifyInclusionTool(origin, args)
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

export function rpc(id: unknown, result: unknown) {
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

export async function handleVerify(id: unknown, args: Record<string, unknown>, origin: string) {
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
