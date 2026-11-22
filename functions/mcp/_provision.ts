/**
 * provision_status and evidence_for — the MCP side of the one-engine provision address
 * (functions/api/_provisions.ts, served over HTTP as GET /api/evidence-bundle?provision=<id>).
 *
 *   provision_status(provision_id)  free. The ladder state of one frozen provision (PREDICATE,
 *                                   RELATED_MEASURE, CROSSWALK_ONLY, HASH_ONLY), its predicates and its
 *                                   capsule bindings, read from committed files. No network, no clock.
 *   evidence_for(provision_id)      the route's free preview for that provision, relayed same-origin, with
 *                                   the route's buy and rail blocks dropped (as evidence_bundle_preview does,
 *                                   because the free door carries no payment text). On the paid door it also
 *                                   names the EXISTING paid tool and arguments (evidence_bundle with the
 *                                   obligation id) when an obligation stands for the provision. This module
 *                                   never charges, never settles and adds no price.
 *
 * NOT YET IN THE FLEET. The definitions below are exported but are not in gspc-tools.json, so /mcp and
 * /mcp/free do not list or dispatch them. Adding two tools to the fleet changes the public tool count on
 * every count-bearing surface and needs the committed probe re-run against a served build (see the PR that
 * added framework_readiness, #3769, for the full list). That is a separate change.
 */
import { resolveProvision, provisionView, PROVISION_USAGE } from "../api/_provisions";
import type { McpToolResult } from "./_handlers";

type Json = Record<string, unknown>;
const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);

const DOCTRINE = "measurement, not certification — what tests a provision today, never a finding that anyone complies with it";
const BASE = { doctrine: DOCTRINE, determination: "NONE", not_a_certification: true } as const;

const PROVISION_ARG = {
  type: "string",
  maxLength: 64,
  description:
    "A frozen provision id, CELEX number:article (for example 32024R1689:50 for EU AI Act Article 50; negative numbers are annexes), or an existing obligation id (article-50, article-53, dora, cra) as an alias.",
};

export const PROVISION_TOOL_DEFINITIONS = [
  {
    name: "provision_status",
    title: "Ladder state of one frozen provision (free)",
    description:
      "For ONE provision of the frozen provision corpus: its frozen SHA-256, its ladder state (PREDICATE: a deterministic check of one observable it names exists; RELATED_MEASURE: a measured axis points to it; CROSSWALK_ONLY; HASH_ONLY: nothing tests it), the predicates and axes behind that state and which capsules bind it. Read from the committed coverage report and backfill map; no network call. A ladder state says what tests a provision, never whether anyone meets it. Measurement, not certification.",
    annotations: { title: "Ladder state of one frozen provision (free)", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: "object", properties: { provision_id: PROVISION_ARG }, required: ["provision_id"], additionalProperties: false },
  },
  {
    name: "evidence_for",
    title: "Evidence relevant to one frozen provision (free preview)",
    description:
      "For ONE frozen provision (or an obligation id as an alias): the ladder state plus, where an existing obligation id stands for the provision, the already-signed measurement cards relevant to that obligation, read live from https://councilof.ai/api/evidence-bundle?provision=<id>. Relevant-to is never a determination, and zero cards is answered EMPTY. On the paid door it names the existing paid tool and its arguments; it never charges by itself. Measurement, not certification.",
    annotations: { title: "Evidence relevant to one frozen provision (free preview)", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: { type: "object", properties: { provision_id: PROVISION_ARG }, required: ["provision_id"], additionalProperties: false },
  },
] as const;

export const PROVISION_TOOL_NAMES = new Set<string>(PROVISION_TOOL_DEFINITIONS.map((t) => t.name));

const arg = (args: Json) => (typeof args.provision_id === "string" ? args.provision_id.trim().slice(0, 64) : "");

export function provisionStatus(origin: string, args: Json): Json {
  const raw = arg(args);
  if (!raw) return { state: "BAD_ARGUMENTS", reason: "provision_id is required", usage: PROVISION_USAGE, ...BASE };
  const r = resolveProvision(raw);
  if (!r) return { state: "UNKNOWN_PROVISION", provision_id: raw, reason: "not a provision id of the frozen manifest and not an existing obligation id", usage: PROVISION_USAGE, ...BASE };
  return { state: "OK", ...provisionView(r, origin), ...BASE };
}

export async function evidenceFor(origin: string, args: Json, door: "free" | "paid"): Promise<Json> {
  const raw = arg(args);
  if (!raw) return { state: "BAD_ARGUMENTS", reason: "provision_id is required", usage: PROVISION_USAGE, ...BASE };
  const u = new URL("/api/evidence-bundle", origin);
  u.searchParams.set("provision", raw);
  let res: Response;
  let body: Json | null;
  try {
    res = await fetch(u.toString(), { headers: { accept: "application/json" } });
    body = rec(await res.json().catch(() => null));
  } catch {
    return { state: "UNREACHABLE", reason: "the evidence-bundle route could not be reached; no cached answer is substituted", source: u.toString(), ...BASE };
  }
  if (res.status === 404) return { state: "UNKNOWN_PROVISION", provision_id: raw, reason: String(body?.reason ?? "unknown provision"), source: u.toString(), ...BASE };
  if (!res.ok || !body || (body.kind !== "preview" && body.kind !== "provision_preview"))
    return { state: "UNREACHABLE", reason: `the route answered HTTP ${res.status}`, http_status: res.status, source: u.toString(), ...BASE };
  const ob = rec(body.obligation);
  const n = typeof body.relevant_signed_cards === "number" ? body.relevant_signed_cards : 0;
  const out: Json = {
    state: !ob ? "PROVISION_ONLY" : n > 0 ? "RELEVANT_CARDS_FOUND" : "EMPTY",
    provision: body.provision ?? null,
    obligation: ob,
    relevant_signed_cards: ob ? n : null,
    cards: ob && Array.isArray(body.cards) ? body.cards : [],
    corpus: ob ? body.corpus ?? null : null,
    relation: "relevant-to — never a determination",
    free_verify: body.free_verify ?? `${origin}/gspc-verify`,
    source: u.toString(),
    ...BASE,
  };
  if (door === "paid")
    out.purchase = ob
      ? { tool: "evidence_bundle", arguments: { obligation: String(ob.id) }, note: "the existing paid tool; its 402 names the price, nothing here does" }
      : { tool: null, note: "no evidence bundle is offered for this provision" };
  return out;
}

function summary(name: string, p: Json): string {
  if (p.state === "BAD_ARGUMENTS" || p.state === "UNKNOWN_PROVISION" || p.state === "UNREACHABLE") return `${p.state} — ${p.reason ?? ""}`;
  const provs = (rec(p.provision)?.provisions ?? p.provisions) as Json[] | undefined;
  const states = (provs ?? []).map((x) => `${x.provision_id} ${x.ladder_state}`).join(", ") || "no provision";
  if (name === "provision_status") return `${states}. What tests the provision today; no determination.`;
  if (p.state === "PROVISION_ONLY") return `${states}. No obligation stands for this provision, so no signed cards are selected.`;
  return `${p.state} — ${states}; ${p.relevant_signed_cards} already-signed card(s) relevant-to the obligation; no determination.`;
}

export async function provisionToolResult(name: string, args: Json, origin: string, door: "free" | "paid"): Promise<McpToolResult> {
  if (!PROVISION_TOOL_NAMES.has(name)) throw new Error(`not a provision tool: ${name}`);
  const payload = name === "provision_status" ? provisionStatus(origin, args) : await evidenceFor(origin, args, door);
  return {
    content: [{ type: "text", text: `${summary(name, payload)}\n\n${JSON.stringify(payload, null, 2)}` }],
    structuredContent: payload,
    isError: payload.state === "BAD_ARGUMENTS" || payload.state === "UNKNOWN_PROVISION",
  };
}
