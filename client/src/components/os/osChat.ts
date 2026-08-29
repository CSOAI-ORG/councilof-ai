/**
 * Council OS chat — four tools only.
 * board_totals · get_axis · verify_card · list_cards
 * No LLM. No fixture. Live GET /api/gspc.
 */
export const OS_TOOLS = ["board_totals", "get_axis", "verify_card", "list_cards"] as const;
export type OsTool = (typeof OS_TOOLS)[number];

export const OS_PROMPT = "Paste a card, name an axis, or ask the board.";
export const OS_EMPTY = "Free verify. Paste never leaves this browser.";

const CANON_AXES = [
  "governance",
  "safety",
  "provenance",
  "continuity",
  "conformance",
  "openness",
  "machinery-conformity",
  "care",
  "cross-reality",
  "detector-interop",
  "art5-safeguard",
  "swarm",
  "affect",
  "jail",
  "provenance-controls",
  "reserve-attestation",
] as const;

const AXIS_ALIASES: Record<string, string> = {
  gov: "governance",
  governing: "governance",
  safe: "safety",
  refusal: "safety",
  prov: "provenance",
  marking: "provenance",
  c2pa: "provenance",
  cont: "continuity",
  pqc: "continuity",
  mcp: "conformance",
  oss: "openness",
  licence: "openness",
  license: "openness",
  mach: "machinery-conformity",
  machinery: "machinery-conformity",
  xr: "cross-reality",
  immersive: "cross-reality",
  det: "detector-interop",
  watermark: "detector-interop",
  art5: "art5-safeguard",
  "article 5": "art5-safeguard",
  prohibited: "art5-safeguard",
  emotion: "affect",
  affective: "affect",
};

export function wantsBoardTotals(question: string): boolean {
  return /\b(walk me through the live (gspc )?board|read[- ]the[- ]board|board totals|ask the board|how many axis|which axis carry a measured|(show|open) (me )?the (live )?board)\b/i.test(
    question,
  );
}

export function wantsListCards(question: string): boolean {
  return /\b(list cards?|card index|published cards?|how many cards)\b/i.test(question);
}

export function looksLikeCardJson(question: string): boolean {
  const t = question.trim();
  if (!t.startsWith("{")) return false;
  return /"signature"\s*:/.test(t) && (/"id"\s*:/.test(t) || /"content_id"\s*:/.test(t));
}

export function namedAxis(question: string): string | null {
  const t = question.trim().toLowerCase();
  if (!t || looksLikeCardJson(t) || wantsBoardTotals(t) || wantsListCards(t)) return null;
  let hit: string | null = null;
  let len = 0;
  for (const name of CANON_AXES) {
    if (t.includes(name) && name.length > len) {
      hit = name;
      len = name.length;
    }
  }
  for (const [alias, canonical] of Object.entries(AXIS_ALIASES)) {
    if ((t === alias || t.includes(alias)) && alias.length > len) {
      hit = canonical;
      len = alias.length;
    }
  }
  return hit;
}

export function formatBoardTotals(j: any): string {
  const t = j?.totals ?? {};
  const grammar = t.public_count || t.count_grammar || "live GET /api/gspc";
  const unmeasured = t.unmeasured_axes;
  const empty =
    typeof unmeasured === "number"
      ? `${unmeasured} UNMEASURED`
      : "UNMEASURED slots stay empty";
  return (
    `Live board from GET /api/gspc — ${grammar}. ${empty}.\n` +
    `SEPARATED leads: ${t.separated_leads ?? "—"}. TIE: ${t.ties ?? "—"}. ` +
    `Empty cells stay empty. This is measurement, not a ranking. Four tools only: ${OS_TOOLS.join(" · ")}.`
  );
}

export function formatAxis(row: any, asked: string): string {
  if (!row) {
    return (
      `No axis named “${asked}” on GET /api/gspc. We do not invent a 23rd axis. ` +
      `Empty stays empty.`
    );
  }
  const status = String(row.status ?? "UNMEASURED");
  if (status !== "MEASURED") {
    return (
      `**${row.axis}** is **${status}** — a first-class cell, not a missing score. ` +
      `No run behind it. n is not a measurement. Cite GET /api/gspc.`
    );
  }
  const n = row.n ?? "—";
  const acc =
    typeof row.accuracy === "number" && Number.isFinite(row.accuracy)
      ? `${(row.accuracy * 100).toFixed(1)}%`
      : "no accuracy (not a model-comparison axis)";
  const sep = row.separation ?? "—";
  return (
    `**${row.axis}** — MEASURED. n=${n}. ${acc}. separation ${sep}. ` +
    `Live from GET /api/gspc, not a fixture.`
  );
}

export function formatCardList(j: any): string {
  const cards = j?.cards ?? {};
  const count = cards.count ?? cards.full_count_hint;
  const stamp = j?.board?.signature?.verification_state ?? "UNSTATED";
  const n = typeof count === "number" ? String(count) : "see GET /api/cards";
  return (
    `list_cards from GET /api/cards — ${n} listed. ` +
    `signed=true means a signature is present, not that anyone has checked it. ` +
    `Board stamp: ${stamp}. Cite the endpoint; do not freeze the count.`
  );
}

export const FOUR_TOOLS_HELP =
  `Four tools only: board_totals, get_axis, verify_card, list_cards. ` +
  `Paste a card (stays in this browser), name an axis, ask the board, or list cards. ` +
  `We measure; we do not certify.`;
