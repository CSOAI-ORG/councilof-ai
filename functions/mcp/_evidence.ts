/**
 * evidence_bundle_preview — the FREE MCP reader over GET /api/evidence-bundle?obligation=<id>[&subject=<s>]
 * (functions/api/evidence-bundle.ts). It returns the route's own free preview: the obligation record,
 * its counsel gate, how many already-signed cards are relevant-to it, and the first cards. The paid,
 * assembled OSCAL bundle is the separate x402 tool evidence_bundle (paid-tools.json, /mcp only).
 *
 * Same-origin, one subrequest, nothing invented: the route decides relevance (functions/api/_obligations.ts),
 * this module only relays it with a state. What it deliberately drops is the route's `buy` and `rail`
 * blocks, because this tool is also served on /mcp/free, a door that carries no payment text.
 * EMPTY IS EMPTY: zero relevant cards is answered as zero, never as an error and never as a pass.
 */
import GSPC_TOOLS from "./gspc-tools.json";
import type { McpToolResult } from "./_handlers";

export const EVIDENCE_TOOL_NAMES = new Set(["evidence_bundle_preview"]);
for (const name of EVIDENCE_TOOL_NAMES)
  if (!GSPC_TOOLS.tools.some((t) => t.name === name)) throw new Error(`gspc-tools.json has no definition for ${name}`);

const DOCTRINE = "measurement, not certification — observations relevant-to an obligation, never a determination";
/** Stamped on every Article 53 answer while counsel review of the Art 53 wording is pending. */
export const ARTICLE_53_REVIEW_NOTE = "Evidence for review, not a legal determination.";

type Json = Record<string, unknown>;
const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);

export async function evidenceBundlePreview(origin: string, args: Json): Promise<Json> {
  const obligation = typeof args.obligation === "string" ? args.obligation.trim() : "";
  const subject = typeof args.subject === "string" ? args.subject.trim().slice(0, 120) : "";
  const base = { doctrine: DOCTRINE, determination: "NONE", not_a_certification: true } as const;
  if (!obligation)
    return { state: "BAD_ARGUMENTS", reason: "obligation is required (article-50, article-53, dora or cra)", ...base };
  const u = new URL("/api/evidence-bundle", origin);
  u.searchParams.set("obligation", obligation);
  if (subject) u.searchParams.set("subject", subject);
  let res: Response;
  let body: Json | null = null;
  try {
    res = await fetch(u.toString(), { headers: { accept: "application/json" } });
    body = rec(await res.json().catch(() => null));
  } catch {
    return { state: "UNREACHABLE", reason: "the evidence-bundle route could not be reached; no cached answer is substituted", source: u.toString(), ...base };
  }
  if (!res.ok || !body || body.kind !== "preview") {
    const known = Array.isArray(body?.obligations)
      ? (body!.obligations as Json[]).map((o) => String(o.id))
      : ["article-50", "article-53", "dora", "cra"];
    return {
      state: res.status === 404 || res.status === 400 ? "UNKNOWN_OBLIGATION" : "UNREACHABLE",
      reason: res.status === 404 || res.status === 400 ? `unknown obligation "${obligation}"; choose one of ${known.join(", ")}` : `the route answered HTTP ${res.status}`,
      http_status: res.status,
      source: u.toString(),
      ...base,
    };
  }
  const ob = rec(body.obligation) ?? {};
  const n = typeof body.relevant_signed_cards === "number" ? body.relevant_signed_cards : 0;
  const isArt53 = ob.id === "article-53";
  return {
    state: n > 0 ? "RELEVANT_CARDS_FOUND" : "EMPTY",
    obligation: ob,
    subject: body.subject ?? null,
    relevant_signed_cards: n,
    cards: Array.isArray(body.cards) ? body.cards : [],
    corpus: body.corpus ?? null,
    relation: "relevant-to — never a determination",
    counsel_confirmed: ob.counsel_confirmed === true,
    ...(isArt53 ? { review_note: typeof ob.review_note === "string" ? ob.review_note : ARTICLE_53_REVIEW_NOTE } : {}),
    free_verify: body.free_verify ?? `${origin}/gspc-verify`,
    source: u.toString(),
    ...base,
  };
}

function summary(p: Json): string {
  const ob = rec(p.obligation);
  const id = ob ? String(ob.id) : "?";
  const note = p.review_note ? ` ${p.review_note}` : "";
  if (p.state === "RELEVANT_CARDS_FOUND")
    return `RELEVANT_CARDS_FOUND — ${p.relevant_signed_cards} already-signed card(s) relevant-to ${id}; observations only, no determination.${note}`;
  if (p.state === "EMPTY") return `EMPTY — no already-signed card is relevant-to ${id} for this subject. Empty is empty.${note}`;
  return `${p.state} — ${p.reason ?? ""}`;
}

export async function evidenceToolResult(name: string, args: Json, origin: string): Promise<McpToolResult> {
  if (!EVIDENCE_TOOL_NAMES.has(name)) throw new Error(`not an evidence tool: ${name}`);
  const payload = await evidenceBundlePreview(origin, args);
  return {
    content: [{ type: "text", text: `${summary(payload)}\n\n${JSON.stringify(payload, null, 2)}` }],
    structuredContent: payload,
    isError: payload.state === "BAD_ARGUMENTS" || payload.state === "UNKNOWN_OBLIGATION",
  };
}
