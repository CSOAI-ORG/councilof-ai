/**
 * resultCard — turns one tool result (the AG-UI tool card) into what a person scans first:
 * a plain title, a state chip with a plain-English meaning, 2–4 stat tiles and one
 * "verify yourself" link. Everything else stays in the expander, verbatim.
 *
 * Nothing here invents a value. A tile is a field the tool returned, printed as returned
 * (dates shortened to the day, booleans as yes/no). A field the tool did not return is not
 * shown; there is no placeholder number.
 */

export type StatTile = { key: string; label: string; value: string };

const TOOL_TITLES: Record<string, string> = {
  server_evidence: "What is measured about this server",
  mcp_trust: "MCP server census",
  verify_card: "Signed record check",
  get_card: "Public-root record",
  verify_inclusion: "Is it in the public root?",
  verify_capsule: "Measurement capsule check",
  board_totals: "Board totals",
  get_axis: "One axis of the board",
  list_cards: "Signed records",
  get_root: "The public root",
  x402_trust: "Paid-door census",
  measurement_index: "Measurement index",
  corrections_summary: "Corrections",
  claim_maintenance_register: "Claims we keep re-checking",
  commission_card: "Fresh run request",
  art50_marking_evidence: "AI-content marking evidence",
  rwa_evidence: "Real-world asset evidence",
  receipts_batch: "Receipts",
  route: "Route decision",
  model_lookup: "Models measured on frozen question banks",
};

export function toolTitle(name: string): string {
  if (Object.prototype.hasOwnProperty.call(TOOL_TITLES, name)) return TOOL_TITLES[name];
  const s = name.replace(/[_-]+/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Tool result";
}

/** Plain-English meaning of a state word. Shown as the chip's tooltip and in the card. */
export function stateMeaning(label: string | undefined): string {
  const l = String(label ?? "").toUpperCase();
  if (!l) return "The tool returned no state word.";
  if (l.startsWith("NOT_MEASURED") || l.startsWith("UNMEASURED") || l.startsWith("NOT_ON_BOARD"))
    return "Nothing is published about this yet. That is not a finding either way; you can request a fresh run.";
  if (l.startsWith("UNCHECKABLE")) return "It could not be checked, usually because the record was not found. Nothing passed or failed.";
  if (l.startsWith("NEEDS_INPUT")) return "The tool needs one more detail before it can answer.";
  if (l.startsWith("PAYMENT_REQUIRED")) return "These are the terms. Nothing has been paid: you would pay from your own wallet, or ask for an invoice by email.";
  if (l.startsWith("INVALID")) return "The check failed: the bytes or the signature do not match.";
  if (l.startsWith("UNREACHABLE") || l.startsWith("ERROR") || l.startsWith("FAILED")) return "The source could not be reached just now. No result is shown in its place.";
  if (l.startsWith("VALID")) return "The check passed: the record matches its published signature or source.";
  if (l.startsWith("MEASURED")) return "Measured: there is a published result behind this.";
  if (l.startsWith("LIVE")) return "Read live from the source just now.";
  if (l.startsWith("TIE")) return "The models measured could not be told apart on this test. A tie stays a tie.";
  if (l.startsWith("UNTESTED")) return "Not yet tested on this axis.";
  if (l.startsWith("QUEUED")) return "Your request is in the queue; nothing has been measured for it yet.";
  if (l.startsWith("RETRIEVABLE")) return "Signed results are published for this request; open them below.";
  if (l.startsWith("RECEIVED_FOR_REVIEW")) return "Recorded for a person to review. Nothing is scheduled or charged yet.";
  return "The state word the tool returned.";
}

// Fields that are never a stat: prose, identifiers, plumbing and doctrine lines.
const SKIP = new Set([
  "state", "doctrine", "note", "notes", "source", "kind", "schema", "key", "shard_url", "index_root",
  "version", "more", "not_a_certification", "endpoint", "reason", "detail", "reachable", "headline",
  "partial_reason", "url", "href", "id", "summary", "description", "error", "what", "label",
]);

const PRIORITY = [
  "public_count", "n_capsules", "count", "total", "cards", "axes", "n_cards", "returned", "matches",
  "measured", "verified", "partial", "as_of",
];

const LABELS: Record<string, string> = {
  public_count: "Board",
  n_capsules: "Published results",
  as_of: "As of",
  partial: "Partial read",
  n_cards: "Records",
  cards: "Signed records",
  axes: "Axes",
};

export function humanKey(key: string): string {
  if (Object.prototype.hasOwnProperty.call(LABELS, key)) return LABELS[key];
  const s = key.replace(/^n_/, "").replace(/[_-]+/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
}

function looksOpaque(v: string): boolean {
  return /^[0-9a-f]{24,}$/i.test(v) || /^https?:\/\//i.test(v) || /^[A-Za-z0-9+/=_-]{40,}$/.test(v);
}

function show(key: string, v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) return new Intl.NumberFormat("en-GB").format(v);
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "string") {
    const s = v.trim();
    if (!s || s.length > 40 || looksOpaque(s)) return null;
    if (key === "as_of" || /_at$/.test(key)) {
      const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : null;
    }
    return s;
  }
  return null;
}

/** Up to `max` stat tiles from a tool's structured output, printed as returned. */
export function statTiles(output: unknown, max = 4): StatTile[] {
  if (!output || typeof output !== "object" || Array.isArray(output)) return [];
  const o = output as Record<string, unknown>;
  const found: StatTile[] = [];
  const push = (key: string, label: string, v: unknown) => {
    if (found.some((t) => t.key === key)) return;
    const value = show(key, v);
    if (value !== null) found.push({ key, label, value });
  };
  const keys = Object.keys(o).filter((k) => !SKIP.has(k));
  const ordered = [...PRIORITY.filter((k) => keys.includes(k)), ...keys.filter((k) => !PRIORITY.includes(k))];
  for (const k of ordered) {
    const v = o[k];
    if (Array.isArray(v)) {
      // A list the tool returned is shown by its length, labelled as such.
      if (/^(cards|capsules|rows|items|results|axes|corrections|matches)$/.test(k)) push(k, humanKey(k), v.length);
      continue;
    }
    if (v && typeof v === "object") continue;
    push(k, humanKey(k), v);
  }
  // One level into small numeric maps (counts / separation) when the top level was thin.
  if (found.length < 2) {
    for (const k of ["separation", "counts"]) {
      const inner = o[k];
      if (!inner || typeof inner !== "object" || Array.isArray(inner)) continue;
      for (const [ik, iv] of Object.entries(inner as Record<string, unknown>)) {
        if (typeof iv === "number") push(`${k}.${ik}`, humanKey(ik), iv);
      }
    }
  }
  // as_of last: it is context, not the headline.
  const asOf = found.filter((t) => t.key === "as_of");
  const rest = found.filter((t) => t.key !== "as_of");
  return [...rest.slice(0, max - (asOf.length ? 1 : 0)), ...asOf].slice(0, max);
}

/** The one link a reader follows to check the result themselves. */
export function verifyHref(citationUrl: string | null | undefined): string | null {
  if (!citationUrl) return null;
  try {
    const u = new URL(citationUrl, "https://councilof.ai");
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin === "https://councilof.ai" ? `${u.pathname}${u.search}${u.hash}` : u.toString();
  } catch {
    return null;
  }
}

/** What a stranger typed: a signed record id, a server/web address, or (otherwise) a model name. */
export type SubjectKind = "record" | "server" | "model" | "empty";

export function classifySubject(raw: string): SubjectKind {
  const s = raw.trim();
  if (!s) return "empty";
  if (/^(sha256:)?[0-9a-f]{64}$/i.test(s)) return "record";
  if (/^https?:\/\//i.test(s)) return "server";
  // A bare host (example.com, mcp.example.org/path) — but not a model tag like "qwen2.5:7b" or "llama-3.1-8b".
  if (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,24})(?:[/:][^\s]*)?$/i.test(s) && !/:\d+b\b/i.test(s) && !/^[\w-]+\.\d/.test(s))
    return "server";
  return "model";
}

/** The question the free router answers for each kind (POST /api/agui/run; same tools as /mcp). */
export function freeQuestion(kind: SubjectKind, subject: string): string | null {
  const s = subject.trim();
  if (kind === "record") return `verify ${s.replace(/^sha256:/i, "")}`;
  if (kind === "server") return `What is measured about ${s}?`;
  return null;
}

export type ModelRow = { id: string; kind?: string; cards?: number; axes?: number; name_published?: boolean };

function norm(s: string): string {
  return s.toLowerCase().replace(/^(ollama:|t4:|hf:)/, "").replace(/:latest$/, "").replace(/[\s_]+/g, "-");
}

/** Models from /interop/models-measured.json whose id matches what was typed (exact first, then contains). */
export function matchModels(models: ModelRow[], typed: string, max = 5): ModelRow[] {
  const q = norm(typed);
  if (q.length < 2) return [];
  const exact = models.filter((m) => norm(m.id) === q);
  const partial = models.filter((m) => norm(m.id) !== q && norm(m.id).includes(q));
  return [...exact, ...partial].slice(0, max);
}

/** One row of /interop/pod-cards-index.json (built from the signed card bytes at deploy time). */
export type PodCardRow = { id?: string; url?: string; subject?: string; status?: string | null; run_id?: string | null };

/**
 * The newest MEASURED signed run on file for one model, so a "yes, it is measured" answer carries a
 * date and one record a reader can open. The date is the run's own UTC day, read from its run_id
 * (YYYYMMDDThhmmss…); a row without a parseable run_id, a URL or MEASURED status is skipped, never
 * guessed. null = no such row, and the caller then shows no date rather than a placeholder.
 */
export function newestSignedRun(cards: PodCardRow[] | null | undefined, modelId: string): { date: string; url: string; id: string } | null {
  if (!Array.isArray(cards)) return null;
  const want = norm(modelId);
  let best: { key: string; date: string; url: string; id: string } | null = null;
  for (const c of cards) {
    if (!c || typeof c.subject !== "string" || norm(c.subject) !== want) continue;
    if (c.status !== "MEASURED" || typeof c.url !== "string" || typeof c.run_id !== "string") continue;
    const m = /^(\d{4})(\d{2})(\d{2})T/.exec(c.run_id);
    if (!m) continue;
    if (!best || c.run_id > best.key) best = { key: c.run_id, date: `${m[1]}-${m[2]}-${m[3]}`, url: c.url, id: typeof c.id === "string" ? c.id : "" };
  }
  return best ? { date: best.date, url: best.url, id: best.id } : null;
}
