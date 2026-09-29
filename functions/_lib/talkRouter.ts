/**
 * talkRouter — one deterministic "ask it in words" router shared by POST /api/chat, the A2A
 * plain-text path (POST /api/a2a SendMessage with a text Part) and the AG-UI run endpoint
 * (POST /api/agui/run).
 *
 * WHAT IT DOES
 *   1. routeIntent(text) maps a question onto one or more of the SAME tools POST /mcp serves
 *      (functions/mcp/gspc-tools.json + paid-tools.json), using keyword and entity extraction
 *      only: a 64-hex id -> verify_card / get_card / verify_inclusion, a domain or URL ->
 *      server_evidence (+ mcp_trust census context), an axis name -> get_axis, "board" ->
 *      board_totals, and so on. No model is in the path.
 *   2. callTool(name, args, origin) dispatches IN-PROCESS to the functions /mcp itself calls
 *      (sharedToolResult / measurementToolResult / paidToolResult), so the answer cannot
 *      disagree with the MCP door.
 *   3. talk(text, origin) returns the tool's own summary line and selected fields verbatim,
 *      a citation (tool name + record id + URL) and the tool's own state label. Nothing is
 *      authored here: every number in an answer is a field of a tool's output.
 *
 * WHAT IT DOES NOT DO
 *   - It never pays. x_payment is stripped from every routed call; a paid tool called without it
 *     answers with its 402 challenge, which is reported as such (nothing charged, payment would
 *     come from the caller's own wallet).
 *   - It never guesses. An unrecognised question returns kind "help": the list of what it can
 *     answer, with no number in it.
 *   - It never grades trust. "Is X trustworthy" is answered with what is measured about X and
 *     what the census counts; "trustworthy" is not a state any tool emits.
 */
import GSPC_TOOLS from "../mcp/gspc-tools.json";
import PAID_TOOLS from "../mcp/paid-tools.json";
import AXIS_ALIASES from "../mcp/axis-aliases.json";
import { sharedToolResult, type McpToolResult } from "../mcp/_handlers";
import { MEASUREMENT_TOOL_NAMES, measurementToolResult } from "../mcp/_measurement";
import { PAID_TOOL_NAMES, paidToolResult } from "../mcp/_paid";

type Json = Record<string, unknown>;

export type ToolCall = { tool: string; args: Json };

export type Plan =
  | { kind: "tools"; intent: string; calls: ToolCall[] }
  | { kind: "needs_input"; intent: string; tool: string; missing: string; example: string }
  | { kind: "help"; intent: "help" | "unknown" };

export type Citation = { tool: string; record_id: string | null; url: string | null };

export type ToolOutcome = {
  tool: string;
  args: Json;
  paid: boolean;
  label: string;
  summary: string;
  citation: Citation;
  output: unknown;
  is_error: boolean;
};

export type TalkAnswer = {
  kind: Plan["kind"];
  intent: string;
  grounded: boolean;
  answer: string;
  label: string | null;
  tool_calls: ToolOutcome[];
  citations: Citation[];
  answered_by: string;
};

const FREE_NAMES: string[] = (GSPC_TOOLS as { tools: { name: string }[] }).tools.map((t) => t.name);
const PAID_NAMES: string[] = (PAID_TOOLS as { tools: { name: string }[] }).tools.map((t) => t.name);
/** Every tool the router may route to — exactly the /mcp tools/list, derived, never typed. */
export const ROUTABLE_TOOLS = new Set<string>([...FREE_NAMES, ...PAID_NAMES]);

const AXES: Record<string, string[]> = (AXIS_ALIASES as { axes: Record<string, string[]> }).axes;

const HEX64 = /\b([0-9a-f]{64})\b/i;
const URL_RE = /\bhttps?:\/\/[^\s<>"'`)\]]+/i;
// A bare host name. File-like suffixes are not hosts ("root.json", "agent-card.json").
const HOST_RE = /\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62})\b/gi;
const NOT_TLD = new Set(["json", "md", "html", "htm", "ts", "js", "mjs", "txt", "py", "csv", "ots", "yaml", "yml", "pdf", "png", "jpg", "svg", "xml", "gz", "zip", "sh"]);

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const trimUrl = (u: string) => u.replace(/[.,;:!?]+$/, "");

/** First http(s) URL, else first bare host in the text; null when there is none. */
export function extractEndpoint(text: string): { url: string; bareHost: boolean } | null {
  const m = text.match(URL_RE);
  if (m) return { url: trimUrl(m[0]), bareHost: false };
  for (const h of text.matchAll(HOST_RE)) {
    const host = h[1].toLowerCase();
    const tld = host.split(".").pop() ?? "";
    if (NOT_TLD.has(tld)) continue;
    if (/^\d+(\.\d+)+$/.test(host)) continue; // a version number, not a host
    if (/^(e\.g|i\.e|etc)$/i.test(host)) continue;
    return { url: `https://${host}/mcp`, bareHost: true };
  }
  return null;
}

/** The canonical axis a question names (canonical id or one of its aliases), else null. */
export function extractAxis(text: string): string | null {
  const t = text.toLowerCase();
  // Longest names first so "provenance-controls" wins over "provenance".
  const entries: [string, string][] = [];
  for (const [axis, aliases] of Object.entries(AXES)) {
    entries.push([axis, axis]);
    for (const a of aliases) if (a.length >= 4 || a === "xr") entries.push([a.toLowerCase(), axis]);
  }
  entries.sort((a, b) => b[0].length - a[0].length);
  for (const [name, axis] of entries) {
    // a hyphenated alias also matches with spaces ("effect binding")
    const pat = esc(name).replace(/\\-|-/g, "[- ]");
    if (new RegExp(`(^|[^a-z0-9-])${pat}($|[^a-z0-9-])`, "i").test(t)) return axis;
  }
  return null;
}

function firstJsonObject(text: string): string | null {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  const s = text.slice(a, b + 1);
  try {
    JSON.parse(s);
    return s;
  } catch {
    return null;
  }
}

/**
 * Deterministic intent routing. Pure: no I/O. Entity rules run before topic keywords, so a
 * question that names a card id or a server is answered about THAT id or server.
 */
export function routeIntent(raw: string): Plan {
  const text = String(raw ?? "").trim();
  const t = text.toLowerCase().replace(/\s+/g, " ");
  if (!t) return { kind: "help", intent: "unknown" };

  // 1. A pasted measurement capsule.
  if (/measurement-capsule|capsule_id/.test(t)) {
    const json = firstJsonObject(text);
    if (json) return { kind: "tools", intent: "verify a measurement capsule", calls: [{ tool: "verify_capsule", args: { capsule_json: json } }] };
  }

  // 2. Paid actions (x402). Routed only on an explicit ask; the router never pays.
  if (/\b(commission|order)\b.*\b(card|measurement|attestation)\b|\brequest (an? )?attestation\b/.test(t)) {
    const ep = extractEndpoint(text);
    const hex = t.match(HEX64);
    const subj = hex?.[1] ?? (ep ? ep.url : null) ?? t.match(/\bfor ([a-z0-9._:/@+-]{2,120})\b/)?.[1] ?? null;
    if (!subj) return { kind: "needs_input", intent: "commission a signed card", tool: "commission_card", missing: "subject", example: "commission a card for https://example.com/mcp" };
    const axis = extractAxis(text);
    return { kind: "tools", intent: "commission a signed card", calls: [{ tool: "commission_card", args: { subject: subj, ...(axis ? { axis } : {}) } }] };
  }
  if (/\b(article|art\.?) ?50\b|\bc2pa\b|\bmarking evidence\b|\bwatermark/.test(t)) {
    const ep = text.match(URL_RE);
    if (!ep) return { kind: "needs_input", intent: "Article 50 marking evidence", tool: "art50_marking_evidence", missing: "url", example: "article 50 marking evidence for https://example.com/image.png" };
    return { kind: "tools", intent: "Article 50 marking evidence", calls: [{ tool: "art50_marking_evidence", args: { url: trimUrl(ep[0]) } }] };
  }
  if (/\brwa\b|\breal[- ]world asset|\btokeni[sz]ed asset/.test(t)) {
    const asset = text.match(/\b(r[1-9A-HJ-NP-Za-km-z]{24,34})\b/)?.[1] ?? text.match(/\b(?:for|of|asset) ([A-Z][A-Z0-9]{1,11})\b/)?.[1] ?? null;
    if (!asset) return { kind: "needs_input", intent: "RWA evidence", tool: "rwa_evidence", missing: "asset", example: "rwa evidence for RLUSD" };
    return { kind: "tools", intent: "RWA evidence", calls: [{ tool: "rwa_evidence", args: { asset } }] };
  }
  if (/\breceipts?\b.*\b(batch|since|from|window)\b|\breceipts batch\b/.test(t)) {
    const from = text.match(/\b(\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?)\b/)?.[1] ?? null;
    if (!from) return { kind: "needs_input", intent: "receipts batch", tool: "receipts_batch", missing: "from", example: "receipts batch from 2026-09-01" };
    return { kind: "tools", intent: "receipts batch", calls: [{ tool: "receipts_batch", args: { from } }] };
  }

  // 3. A 64-hex id: a card or a root leaf.
  const hex = t.match(HEX64)?.[1];
  if (hex) {
    if (/\b(inclu|merkle|in the root|leaf of)/.test(t)) return { kind: "tools", intent: "inclusion in the public root", calls: [{ tool: "verify_inclusion", args: { sha256: hex } }] };
    if (/\b(get|show|fetch|read|open)\b.*\b(leaf|card-v0)\b/.test(t)) return { kind: "tools", intent: "read a public-root leaf", calls: [{ tool: "get_card", args: { sha256: hex } }] };
    return { kind: "tools", intent: "verify a signed card", calls: [{ tool: "verify_card", args: { card: hex } }] };
  }

  // 4. A named server / endpoint / domain.
  const ep = extractEndpoint(text);
  if (ep) {
    if (/\bx402\b|\bpayment door|\bpaywall/.test(t)) return { kind: "tools", intent: "x402 door census", calls: [{ tool: "x402_trust", args: {} }] };
    return {
      kind: "tools",
      intent: "what is measured about this server",
      calls: [
        { tool: "server_evidence", args: { endpoint_url: ep.url, ...(ep.bareHost ? { _bare_host: true } : {}) } },
        { tool: "mcp_trust", args: {} },
      ],
    };
  }

  // 5. Topic keywords (no entity).
  if (/\bx402\b|\bpaid (doors?|endpoints?|apis?)\b|\bpayment doors?\b/.test(t)) return { kind: "tools", intent: "x402 door census", calls: [{ tool: "x402_trust", args: {} }] };
  if (/\bmcp\b.*\b(servers?|trust|census|handshake|ecosystem|internet)\b|\b(servers?|trust|census)\b.*\bmcp\b/.test(t)) return { kind: "tools", intent: "MCP handshake census", calls: [{ tool: "mcp_trust", args: {} }] };
  if (/\bmeasurement (index|capsules?)\b|\bcapsules?\b/.test(t)) return { kind: "tools", intent: "measurement capsule index", calls: [{ tool: "measurement_index", args: {} }] };
  if (/\b(public root|merkle root|root\.json|the root)\b/.test(t)) return { kind: "tools", intent: "public root", calls: [{ tool: "get_root", args: {} }] };

  const axis = extractAxis(text);
  if (/\b(list|show|latest|recent|how many)\b.*\bcards?\b|\bsigned cards?\b|\bcard index\b/.test(t))
    return { kind: "tools", intent: "list signed cards", calls: [{ tool: "list_cards", args: { ...(axis ? { axis } : {}), limit: 5 } }] };
  if (axis) return { kind: "tools", intent: `board axis ${axis}`, calls: [{ tool: "get_axis", args: { axis } }] };
  if (/\b(board|scoreboard|totals?|gspc|how many (axes|axis|slots)|measured of|what('s| is) measured|leaderboard)\b/.test(t))
    return { kind: "tools", intent: "board totals", calls: [{ tool: "board_totals", args: {} }] };

  if (/^(hi|hey|hello|help|menu|start)\b|what can (you|i)|capabilit|which tools|what tools/.test(t)) return { kind: "help", intent: "help" };
  return { kind: "help", intent: "unknown" };
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);

/** In-process dispatch to the same functions POST /mcp calls. x_payment never passes. */
export async function callTool(name: string, args: Json, origin: string): Promise<McpToolResult> {
  if (!ROUTABLE_TOOLS.has(name)) throw new Error(`not a /mcp tool: ${name}`);
  const clean: Json = {};
  for (const [k, v] of Object.entries(args)) if (k !== "x_payment" && !k.startsWith("_")) clean[k] = v;
  if (PAID_TOOL_NAMES.has(name)) return paidToolResult(name, clean, origin);
  if (MEASUREMENT_TOOL_NAMES.has(name)) return measurementToolResult(name, clean, origin);
  return sharedToolResult(name, clean, origin);
}

/** The tool's own state word. Never computed from a number; read from the payload. */
export function labelOf(tool: string, p: Json, isError: boolean): string {
  if (PAID_NAMES.includes(tool)) {
    if (p.x402Version !== undefined || /payment required/i.test(String(p.error ?? ""))) return "PAYMENT_REQUIRED";
    return String(p.status ?? p.state ?? (isError ? "ERROR" : "ANSWERED"));
  }
  if (tool === "get_axis" && str(p.status)) return String(p.status);
  if (tool === "board_totals") {
    const counts = Array.isArray(p.counts) ? (p.counts as Json[]) : [];
    const get = (n: string) => counts.find((c) => c.name === n)?.value;
    const m = get("measured"), s = get("axis_slots");
    return typeof m === "number" && typeof s === "number" ? `MEASURED ${m} of ${s} slots` : String(p.state ?? "LIVE");
  }
  const idx = rec(p.index);
  return String(p.state ?? p.status ?? idx?.state ?? (isError ? "ERROR" : "ANSWERED"));
}

export function citationOf(tool: string, p: Json, origin: string): Citation {
  const res = rec(p.resource);
  const capsuleId = rec(p.capsule_id);
  // list_cards: the signed card index it read is the record (its head id and its URL), both fields of the output.
  if (tool === "list_cards") {
    const idx = rec(p.index);
    if (idx && str(idx.source) && idx.state !== "UNREACHABLE") return { tool, record_id: str(idx.head), url: str(idx.source) };
  }
  const recordId =
    str(p.id) ?? str(capsuleId?.recomputed) ?? str(p.key) ?? str(p.merkle_root) ?? str(p.index_root) ??
    str(p.sha256) ?? str(p.card_sha256) ?? (tool === "get_axis" && str(p.axis) ? `axis:${p.axis}` : null) ??
    str(p.as_of) ?? str(rec(p.as_of)?.fetched_at) ?? null;
  const url =
    str(p.row_url) ?? str(p.shard_url) ?? str(p.index_url) ?? str(p.source) ?? str(res?.url) ?? str(p.route) ??
    str(p.rule) ?? `${origin}/mcp`;
  return { tool, record_id: recordId, url };
}

/** Fields shown verbatim per tool. Only keys the payload actually carries are shown. */
const SHOW: Record<string, string[]> = {
  board_totals: ["public_count"],
  get_axis: ["n", "accuracy", "interval", "leader", "note"],
  verify_card: ["id", "reason", "pinned_key", "note"],
  get_card: ["reason", "sha256"],
  verify_inclusion: ["reason", "merkle_root"],
  get_root: ["as_of", "card_count", "merkle_root", "note"],
  list_cards: [],
  x402_trust: ["as_of", "headline"],
  mcp_trust: ["as_of", "headline", "partial", "doctrine"],
  measurement_index: ["as_of", "n_capsules_total", "n_batches", "index_root"],
  verify_capsule: ["reason"],
  server_evidence: ["endpoint", "n_capsules", "by_adapter", "as_of", "other_endpoints_measured_at_this_origin", "note"],
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function renderOutcome(o: ToolOutcome): string {
  const p = rec(o.output) ?? {};
  const lines: string[] = [];
  lines.push(`**${o.tool}** → ${o.summary}`);
  if (o.paid && o.label === "PAYMENT_REQUIRED") {
    const res = rec(p.resource);
    lines.push(
      `- This is a paid (x402) tool. The call returned its **402 challenge**; nothing was charged and nothing was paid. ` +
        `Payment would come from **your own wallet**: sign the challenge's accepts[] and call again with x_payment. This assistant never pays.`,
    );
    if (res?.url) lines.push(`- resource: ${res.url}`);
    if (res?.description) lines.push(`- terms: ${String(res.description)}`);
  } else {
    const keys = SHOW[o.tool] ?? [];
    for (const k of keys) {
      if (!(k in p)) continue;
      const v = p[k];
      if (Array.isArray(v) && v.length === 0) continue;
      lines.push(`- ${k}: ${fmt(v)}`);
    }
    if (o.tool === "board_totals" && Array.isArray(p.counts)) {
      for (const c of p.counts as Json[]) lines.push(`- ${c.name}: ${fmt(c.value)} (${fmt(c.kind)})`);
      const sep = rec(p.separation);
      if (sep && str(sep.public_count)) lines.push(`- separation: ${sep.public_count}`);
    }
    if (o.tool === "list_cards") {
      const idx = rec(p.index);
      if (idx) lines.push(`- index n_cards_declared: ${fmt(idx.n_cards_declared)}`);
      const store = rec(p.card_store_count_endpoint);
      if (store) lines.push(`- card store count endpoint: ${fmt(store.count)}`);
    }
    if (o.tool === "mcp_trust") {
      const en = rec(p.enumeration);
      if (en) lines.push(`- enumeration: ${fmt(en.unique_hosts)} hosts enumerated, complete=${fmt(en.complete)}${en.stop_reason ? ` (${en.stop_reason})` : ""}`);
    }
  }
  lines.push(`- state: **${o.label}**`);
  lines.push(`- source: tool \`${o.tool}\` · record ${o.citation.record_id ?? "n/a"} · ${o.citation.url ?? "n/a"}`);
  return lines.join("\n");
}

export const HELP_TEXT =
  "I answer by calling the same tools as POST /mcp and quoting their output. I can:\n" +
  "- **board totals** — \"what does the board say\" (board_totals)\n" +
  "- **one axis** — \"how did safety measure\" (get_axis)\n" +
  "- **a server** — \"is example.com/mcp trustworthy\" → what is measured about it (server_evidence) and the MCP census (mcp_trust)\n" +
  "- **a signed card** — paste a 64-hex card id (verify_card); \"is <hex> included in the root\" (verify_inclusion)\n" +
  "- **the public root** — \"show the public root\" (get_root); **signed cards** — \"list signed cards\" (list_cards)\n" +
  "- **x402 doors** — \"x402 census\" (x402_trust); **capsules** — \"measurement index\" (measurement_index)\n" +
  "- **paid tools** — commission_card, art50_marking_evidence, rwa_evidence, receipts_batch: I return the 402 challenge; payment comes from your own wallet, never from me.\n\n" +
  "I do not invent numbers, grade trust, or pay for anything.";

/** A 402 challenge from a paid tool is an answer (the challenge), not a failure. */
function summaryOf(r: McpToolResult): string {
  const first = String(r.content?.[0]?.text ?? "").split("\n\n")[0].split("\n")[0];
  return first.length > 400 ? first.slice(0, 400) + "…" : first;
}

async function runCall(call: ToolCall, origin: string): Promise<ToolOutcome> {
  const r = await callTool(call.tool, call.args, origin);
  const p = rec(r.structuredContent) ?? {};
  const paid = PAID_NAMES.includes(call.tool);
  const label = labelOf(call.tool, p, r.isError);
  const summary = paid && label === "PAYMENT_REQUIRED" ? "PAYMENT_REQUIRED — 402 challenge returned; nothing charged." : summaryOf(r);
  const args: Json = {};
  for (const [k, v] of Object.entries(call.args)) if (!k.startsWith("_") && k !== "x_payment") args[k] = v;
  return { tool: call.tool, args, paid, label, summary, citation: citationOf(call.tool, p, origin), output: r.structuredContent ?? null, is_error: r.isError };
}

/**
 * Execute a plan. `onEvent` (optional) sees each call start/finish — the AG-UI endpoint streams
 * from it. The server_evidence call for a bare host follows the index's own sibling list once:
 * "example.com" is tried as https://example.com/mcp, and if that exact endpoint carries nothing
 * but the index lists other endpoints at the same origin, the first listed one is read.
 */
export async function executePlan(
  plan: Plan,
  origin: string,
  onEvent?: (e: { phase: "start" | "end"; call: ToolCall; outcome?: ToolOutcome; id: string }) => void | Promise<void>,
): Promise<TalkAnswer> {
  if (plan.kind === "help") {
    return { kind: "help", intent: plan.intent, grounded: false, answer: (plan.intent === "unknown" ? "I could not match that question to a tool, so I have no grounded answer for it.\n\n" : "") + HELP_TEXT, label: null, tool_calls: [], citations: [], answered_by: "deterministic router (no tool matched)" };
  }
  if (plan.kind === "needs_input") {
    return {
      kind: "needs_input", intent: plan.intent, grounded: false,
      answer: `\`${plan.tool}\` needs \`${plan.missing}\`. Try: "${plan.example}". Nothing was called.`,
      label: "NEEDS_INPUT", tool_calls: [], citations: [], answered_by: "deterministic router (no tool called)",
    };
  }
  const outcomes: ToolOutcome[] = [];
  let i = 0;
  for (const call0 of plan.calls) {
    let call = call0;
    const id = `call_${++i}`;
    await onEvent?.({ phase: "start", call, id });
    let o: ToolOutcome;
    try {
      o = await runCall(call, origin);
      if (call.tool === "server_evidence" && call.args._bare_host && o.label !== "MEASURED") {
        const sib = (rec(o.output)?.other_endpoints_measured_at_this_origin as unknown[] | undefined)?.find((u) => typeof u === "string");
        if (typeof sib === "string") {
          call = { tool: "server_evidence", args: { endpoint_url: sib } };
          o = await runCall(call, origin);
        }
      }
    } catch (e) {
      o = {
        tool: call.tool, args: call.args, paid: PAID_NAMES.includes(call.tool), label: "UNREACHABLE",
        summary: `UNREACHABLE — the tool could not be run (${e instanceof Error ? e.message : String(e)}); no number is substituted.`,
        citation: { tool: call.tool, record_id: null, url: `${origin}/mcp` }, output: null, is_error: true,
      };
    }
    outcomes.push(o);
    await onEvent?.({ phase: "end", call, outcome: o, id });
  }
  const answer =
    outcomes.map(renderOutcome).join("\n\n") +
    "\n\n_Every line above is a field of the named tool's output (the same tools POST /mcp serves). Measurement, not certification; no trust grade is given._";
  return {
    kind: "tools", intent: plan.intent, grounded: true, answer,
    label: outcomes[0]?.label ?? null, tool_calls: outcomes, citations: outcomes.map((o) => o.citation),
    answered_by: `tool:${outcomes.map((o) => o.tool).join("+")}`,
  };
}

export async function talk(text: string, origin: string): Promise<TalkAnswer> {
  return executePlan(routeIntent(text), origin);
}
