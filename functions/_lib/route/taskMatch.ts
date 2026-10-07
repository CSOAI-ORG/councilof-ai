/**
 * GSPC Route: which GSPC tool's purpose the request names (7 Oct 2026).
 *
 * With no candidates declared, the candidates are the GSPC tool fleet. Before this file a caller who
 * sent only a task got the tie-break's answer (declared cost, then locality, then the id in A-Z
 * order), so "which tool verifies a signed card" came back board_totals. Each fleet tool is now
 * scored against the request from two sources, both fixed in this repo:
 *
 *   1. PURPOSE: the questions the tool exists to answer, written as patterns below. An entity in the
 *      request counts most: a 64-hex id (a card), a URL or host name (a server), an axis name.
 *   2. DESCRIPTION: the words of the tool's tools/list title and description that the request
 *      shares, each weighted by how few tools use it (a word every tool uses tells nothing).
 *
 * A tool matches only when one of its purpose patterns does; description words then order the tools
 * that matched. When no tool matches, nothing is chosen and the route says UNTESTED. It never falls
 * back to a pick by name order.
 *
 * Pure: no I/O and no model. The task text is read in memory only; it is never stored, and nothing
 * here writes any of its words into a response (scores and tool ids only).
 */
import FREE from "../../mcp/gspc-tools.json";
import PAID from "../../mcp/paid-tools.json";
import AXIS_ALIASES from "../../mcp/axis-aliases.json";

type Pattern = { re: RegExp; w: number };

const HEX64 = /\b[0-9a-f]{64}\b/i;
const URL_RE = /\bhttps?:\/\/[^\s<>"'`)\]]+/i;
const HOST_RE = /\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62})\b/gi;
// A file name is not a host ("root.json", "card_index.json").
const NOT_TLD = new Set(["json", "md", "html", "htm", "ts", "js", "mjs", "txt", "py", "csv", "ots", "yaml", "yml", "pdf", "png", "jpg", "jpeg", "svg", "xml", "gz", "zip", "sh"]);

/** true when the request names a server: an http(s) URL or a bare host name. */
export function namesEndpoint(text: string): boolean {
  if (URL_RE.test(text)) return true;
  for (const m of text.matchAll(HOST_RE)) {
    const host = m[1].toLowerCase();
    const tld = host.split(".").pop() ?? "";
    if (NOT_TLD.has(tld)) continue;
    if (/^(e\.g|i\.e|etc)$/.test(host)) continue;
    return true;
  }
  return false;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const AXIS_NAMES: string[] = (() => {
  const axes = (AXIS_ALIASES as { axes: Record<string, string[]> }).axes;
  const out: string[] = [];
  for (const [axis, aliases] of Object.entries(axes)) {
    out.push(axis);
    for (const a of aliases) if (a.length >= 4) out.push(a.toLowerCase());
  }
  return out.sort((a, b) => b.length - a.length);
})();

/** true when the request names a board axis (canonical id or alias, as axis-aliases.json spells it). */
export function namesAxis(t: string): boolean {
  return AXIS_NAMES.some((name) => new RegExp(`(^|[^a-z0-9-])${esc(name).replace(/\\-|-/g, "[- ]")}($|[^a-z0-9-])`).test(t));
}

const OBLIGATION = /\b(article[- ]?5[03]|art\.?\s?5[03]|dora|cra|cyber resilience act|gpai transparency|ai act)\b/;
const VERIFY_VERB = "(?:verif|check|validat|genuine|authentic|tamper|forged|fake|recompute|trust|real|legit|spoof)";

/**
 * The purpose of every fleet tool, as patterns over the lower-cased request. Weights: an entity or a
 * phrase only this tool answers 4-6, a topic word 1-3. tool-purpose coverage is pinned by a test: every
 * tool tools/list serves on /mcp has an entry here.
 */
export const PURPOSE: Record<string, Pattern[]> = {
  board_totals: [
    { re: /\b(board|scoreboard|leaderboard)\b/, w: 3 },
    { re: /\btotals?\b/, w: 3 },
    { re: /\bhow many (axes|axis|slots)\b|\bmeasured of\b|\bwhat (is|gets|has been) measured\b|\bwhat (do|does) [a-z0-9 .'-]{0,40}\bmeasure\b/, w: 3 },
    { re: /\b(best|safest|top|winner|winning|strongest|leading)\b.*\b(models?|llms?|ai)\b|\bwhich (model|llm|ai)\b.*\b(better|safer|wins?)\b/, w: 3 },
    // Order-free: a quality word and a model word anywhere in the request ("which AI is safest",
    // "is this AI model safe to use", "what scores did Claude get", "compare two models").
    {
      re: /(?=.*\b(best|safest|safer|safe|honest|honesty|top|winner|strongest|leading|scores?|scored|rank\w*|compare\w*|comparison|versus|vs)\b)(?=.*\b(models?|llms?|ai|ais|chatbots?|claude|gpt[- ]?\w*|chatgpt|gemini|llama|grok|mistral|deepseek|qwen)\b)/,
      w: 3,
    },
  ],
  get_axis: [
    { re: /\baxis\b/, w: 2 },
    { re: /\b(accuracy|interval|sample size|separation)\b/, w: 2 },
    { re: /\bhow (did|does|do|well)\b.*\b(measure|score|perform|do|rate)\b/, w: 1 },
  ],
  verify_card: [
    { re: new RegExp(`(?=.*\\b${VERIFY_VERB}\\w*)(?=.*\\bcards?\\b)`), w: 5 },
    { re: /\b(signature|ed25519|signed by|issued by)\b/, w: 1 },
  ],
  list_cards: [
    { re: /\b(list|show|latest|recent|newest|how many|browse|every|all)\b.*\bcards\b|\b(list|show|latest|recent|newest)\b.*\bcard\b/, w: 5 },
    { re: /\bcard index\b|\bindex of (signed )?cards\b/, w: 4 },
    { re: /\bcards?\b/, w: 1 },
  ],
  get_card: [
    { re: /\bcard-v0\b|\bleaf\b/, w: 3 },
    { re: /\b(get|read|fetch|open|show)\b.*\b(leaf|card-v0)\b/, w: 3 },
  ],
  get_root: [
    { re: /\b(public|merkle) root\b|\broot\.json\b|\bthe root\b/, w: 4 },
    { re: /\bmerkle\b/, w: 1 },
    { re: /\broot\b/, w: 1 },
  ],
  verify_inclusion: [
    { re: /\binclu(de|ded|des|sion)\b|\bin the (public |merkle )?root\b|\bpart of the root\b|\baudit path\b|\bproof of inclusion\b/, w: 6 },
    { re: /\b(hash|sha-?256|leaf)\b/, w: 2 },
  ],
  x402_trust: [
    { re: /\bx402\b/, w: 5 },
    { re: /\bpayment doors?\b|\bpaywalls?\b|\bpaid (doors?|endpoints?|apis?)\b|\b402 challenges?\b|\bhttp 402\b/, w: 4 },
    { re: /\b402\b/, w: 2 },
  ],
  mcp_trust: [
    { re: /\bmcp\b.*\b(servers|census|handshakes?|ecosystem|internet)\b|\b(servers|census|handshakes?)\b.*\bmcp\b/, w: 5 },
    { re: /\bhandshakes?\b|\binitiali[sz]e\b/, w: 3 },
    { re: /\bcensus\b/, w: 1 },
  ],
  measurement_index: [
    { re: /\b(measurement[- ]capsule|capsule|measurement) index\b/, w: 6 },
    { re: /\bcapsules\b/, w: 2 },
    { re: /\bbatch(es)?\b|\banchors?\b|\bopentimestamps\b/, w: 1 },
  ],
  verify_capsule: [
    { re: new RegExp(`(?=.*\\b${VERIFY_VERB}\\w*)(?=.*\\bcapsules?\\b)`), w: 6 },
    { re: /\bcapsule_id\b|\bmeasurement-capsule\b/, w: 4 },
  ],
  server_evidence: [
    // The entity rule: a URL or a host name in the request (scored in matchTask, not as a pattern).
    { re: /\b(this|that|my|one|our|their|the|a) (mcp |a2a |remote )?(server|endpoint)\b/, w: 3 },
    { re: /\bper server\b|\bserver evidence\b|\babout (a|one|this) server\b/, w: 3 },
    { re: /\bendpoint\b/, w: 2 },
  ],
  evidence_bundle_preview: [
    { re: OBLIGATION, w: 3 },
    { re: new RegExp(`(?=.*${OBLIGATION.source})(?=.*\\b(evidence|records?|cards?|signed)\\b)`), w: 3 },
    { re: /\bobligations?\b|\bregulations?\b/, w: 1 },
    { re: /\bcomplian\w*|\bcomply\b|\bregulat\w*|\blegal(ly)?\b/, w: 2 },
  ],
  commission_card: [
    { re: /\b(commission|order|request|buy|purchase)\b.*\b(card|measurement|attestation|run|test)\b/, w: 5 },
    { re: /\bfresh run\b|\bnew measurement\b|\bmeasure my\b/, w: 3 },
  ],
  art50_marking_evidence: [
    { re: /\b(article|art\.?) ?50\b/, w: 3 },
    { re: /\bc2pa\b|\bmarking\b|\bwatermark\w*|\bcontent credentials\b/, w: 4 },
    { re: /\b(image|photo|video|audio|media|png|jpe?g)\b/, w: 2 },
  ],
  rwa_evidence: [
    { re: /\brwa\b|\breal[- ]world assets?\b|\btokeni[sz]ed (assets?|treasur\w*|bonds?|funds?)\b|\bissued assets?\b/, w: 5 },
    { re: /\bxrpl\b|\bxrp ledger\b|\btrust ?lines?\b|\bissuer\b/, w: 3 },
    { re: /\bstablecoins?\b|\brlusd\b/, w: 2 },
  ],
  receipts_batch: [
    { re: /\breceipts?\b/, w: 4 },
    { re: /\b(batch|window|since|between)\b|\bfrom \d{4}/, w: 2 },
    { re: /\bhistor\w*\b/, w: 1 },
  ],
  evidence_bundle: [
    { re: OBLIGATION, w: 3 },
    { re: /\bbundle\b|\boscal\b/, w: 3 },
    { re: /\b(full|download|paid|buy)\b/, w: 1 },
  ],
};

/** Entity rules: an entity in the request names what the request is about. */
function entityScore(tool: string, text: string, t: string): number {
  const hex = HEX64.test(text);
  if (tool === "server_evidence" && !hex && namesEndpoint(text)) return 6;
  if (tool === "get_axis" && namesAxis(t)) return 5;
  if (hex) {
    if (tool === "verify_card") return 4;
    if (tool === "verify_inclusion" || tool === "get_card") return 2;
  }
  return 0;
}

const STOP = new Set(
  ("the a an and or of to in on for by with from at as is are was were be been it its this that these those " +
    "which what who how why when where do does did can could should would will may not no never any every each " +
    "one two per than then there their our your you we us me my i about into over under only also more most " +
    "councilof https http www com api json mcp tool tools free paid x_payment returns return pass").split(" "),
);
const words = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w))
    .map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w));

type ToolDef = { name: string; title?: string; description?: string };
const DEFS: ToolDef[] = [...(FREE as { tools: ToolDef[] }).tools, ...(PAID as { tools: ToolDef[] }).tools];
const DESC_WORDS = new Map<string, Set<string>>(DEFS.map((d) => [d.name, new Set(words(`${d.title ?? ""} ${d.description ?? ""}`))]));
const IDF = (() => {
  const df = new Map<string, number>();
  for (const set of DESC_WORDS.values()) for (const w of set) df.set(w, (df.get(w) ?? 0) + 1);
  const n = DESC_WORDS.size;
  return new Map([...df].map(([w, k]) => [w, Math.log(n / k)]));
})();

/** The description-word part: the request's words found in the tool's description, rarest weighing most. Capped below one purpose hit. */
function descriptionScore(tool: string, t: string): number {
  const set = DESC_WORDS.get(tool);
  if (!set) return 0;
  let s = 0;
  for (const w of new Set(words(t))) if (set.has(w)) s += IDF.get(w) ?? 0;
  return Math.min(0.9, s / 10);
}

/** The score of one tool for one request: 0 when no purpose pattern or entity rule matches. */
export function toolScore(tool: string, text: string): number {
  const t = text.toLowerCase().replace(/\s+/g, " ").trim();
  const pats = PURPOSE[tool];
  if (!pats || !t) return 0;
  let purpose = entityScore(tool, text, t);
  for (const p of pats) if (p.re.test(t)) purpose += p.w;
  if (purpose <= 0) return 0;
  return Math.round((purpose + descriptionScore(tool, t)) * 100) / 100;
}

/** Scores for the candidates that name a fleet tool; every other candidate scores 0. */
export function matchTask(text: string, candidates: Array<{ id: string; tool: string | null }>): Map<string, number> {
  const out = new Map<string, number>();
  for (const c of candidates) out.set(c.id, c.tool ? toolScore(c.tool, text) : 0);
  return out;
}

export type TaskMatch = {
  /** MATCHED: a permitted tool's purpose matches. MATCHED_FORBIDDEN: only tools the policy forbids match. UNTESTED: none matches. */
  state: "MATCHED" | "MATCHED_FORBIDDEN" | "UNTESTED";
  basis: "tool_purpose";
  reason: string;
  /** The tools that matched, highest score first (at most five). A score is a pattern weight, not a measurement. */
  matched: Array<{ id: string; score: number; permit: boolean; forbid_policy: string | null }>;
  method: string;
  /**
   * Set only when the matching tool is a paid (x402) one that the wallet floor held back
   * (floor:paid-needs-caller-wallet): the caller set no policy, so the answer names the paid check and
   * the one next step, instead of a policy refusal.
   */
  paid?: PaidNext & { id: string; tool: string };
};

/** The paid-wallet floor (policy.ts). A paid tool is chosen only when the caller declares a wallet. */
export const PAID_FLOOR = "floor:paid-needs-caller-wallet";

export type PaidNext = {
  /** The free thing to do now, in plain words. */
  free_step: string;
  /** The page that offers the free step and, from the person's own wallet, the paid one. */
  door: string;
};

/**
 * One next step per paid fleet tool (functions/mcp/paid-tools.json). Each free step is one the tool's
 * own tools/list description states (a free preview, or the free tool that previews it); each door is
 * the in-site page for that tool. Coverage is pinned by a test.
 */
export const PAID_NEXT: Record<string, PaidNext> = {
  art50_marking_evidence: {
    free_step: "Run the free detection preview: it checks the same bytes and returns the measurement unsigned.",
    door: "/dashboard?tab=art50",
  },
  commission_card: {
    free_step: "Check the terms with no payment: you see the amount and a free preview of the cards already on file.",
    door: "/dashboard?tab=measured",
  },
  evidence_bundle: {
    free_step: "Run the free evidence_bundle_preview first: it says what the bundle would hold, including when it would be empty.",
    door: "/dashboard?tab=tools&tool=evidence_bundle",
  },
  receipts_batch: {
    free_step: "Run it with preview=true for free: it returns the count, the span and the sha256 of the paid bytes. Recent receipts are free at /root.json.",
    door: "/dashboard?tab=tools&tool=receipts_batch",
  },
  rwa_evidence: {
    free_step: "Run it with preview=true for free: it returns the same on-ledger state, unsigned.",
    door: "/dashboard?tab=tools&tool=rwa_evidence",
  },
};

export const TASK_MATCH_METHOD =
  "functions/_lib/route/taskMatch.ts: purpose patterns per tool (an entity in the request weighs most) plus the request's words found in the tool's tools/list description; a score is a pattern weight, not a measurement";
