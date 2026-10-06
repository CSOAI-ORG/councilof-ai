/**
 * resultCard — turns one tool result (the AG-UI tool card) into what a person scans first:
 * a plain title, a state chip with a plain-English meaning, 2–4 stat tiles and one
 * "verify yourself" link. Everything else stays in the expander, verbatim.
 *
 * Nothing here invents a value. A tile is a field the tool returned, printed as returned
 * (dates shortened to the day, booleans as yes/no). A field the tool did not return is not
 * shown; there is no placeholder number.
 */

export type StatTile = {
  key: string;
  label: string;
  value: string;
  /** Optional small line under the value (e.g. how many entries a median is over). */
  hint?: string;
};

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
  evidence_bundle_preview: "Signed evidence for one obligation",
  route: "Route decision",
  model_lookup: "What is published about this model",
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
  if (l.startsWith("PAYMENT_REQUIRED")) return "This is a paid run. Nothing has been paid; you would pay from your own wallet, or arrange an invoice by email.";
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
  if (/^READ\b/.test(l)) return `${READ_MEANING}.`;
  if (l.startsWith("RELEVANT_CARDS_FOUND")) return "Signed results relevant to this obligation were found. Relevant is not a determination: nothing here says the obligation is met.";
  if (l.startsWith("EMPTY")) return "Nothing was found for this yet. That is not a finding either way.";
  if (l.startsWith("CONSISTENT")) return "The two public statements we compared agree with each other. It does not say either one is good.";
  if (l.startsWith("PROBED")) return "We read the public source directly and recorded what it said. No verdict is drawn from it.";
  if (l.startsWith("SIGNED")) return "Signed by Council of AI. Anyone can check the signature with the link on this card.";
  if (l.startsWith("DELIVERED"))
    return "The paid request returned its payload. That alone does not prove a signature; check the record it returned.";
  return "The state word the tool returned.";
}

/** The chip a fetch-only tool shows: it read a published file and checked no signature. */
export const READ_MEANING = "Read from the published file; no signature was checked";

/**
 * Tools that only fetch a published file. Their own VALID / LIVE means "the file was read and
 * parsed", not "a signature was checked", so the card shows READ and keeps the tool's word small.
 * list_cards and corrections_summary said LIVE for the same kind of read (tools audit retest,
 * 6 Oct 2026: "LIVE vs READ for the same kind of read"); they read files too, so they say READ.
 */
const FETCH_ONLY = new Set(["get_root", "mcp_trust", "x402_trust", "get_card", "list_cards", "corrections_summary"]);

/**
 * The state chip a card shows, and the tool's own word when the chip differs from it.
 * A fetch-only tool that read its file shows READ; a failure word (INVALID, UNREACHABLE …) is
 * never softened into READ, because then nothing was read.
 */
export function chipFor(tool: string, label: string | undefined): { chip: string | undefined; toolWord: string | null } {
  if (label && FETCH_ONLY.has(tool) && /^(VALID|LIVE)\b/i.test(label)) return { chip: "READ", toolWord: label };
  return { chip: label, toolWord: null };
}

// Fields that are never a stat: prose, identifiers, plumbing and doctrine lines.
const SKIP = new Set([
  "state", "doctrine", "note", "notes", "source", "kind", "schema", "key", "shard_url", "index_root",
  "version", "more", "not_a_certification", "endpoint", "reason", "detail", "reachable", "headline",
  "partial_reason", "url", "href", "id", "summary", "description", "error", "what", "label",
  "x402Version", "tool", "route", "sku", "not_gspc", "family", "pinned_key", "rows",
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

type Obj = Record<string, unknown>;
const rec = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const fmt = (n: number): string => new Intl.NumberFormat("en-GB").format(n);
const day = (v: unknown): string | null => (typeof v === "string" ? (v.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null) : null);
const latestDay = (values: unknown[]): string | null =>
  values.map(day).filter((d): d is string => Boolean(d)).sort().pop() ?? null;
const pct = (x: number, round: (n: number) => number = Math.round): string => `${round(x * 100)}%`;

/** A duration in seconds, in the largest plain unit that keeps it readable. */
export function plainDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const min = Math.round(seconds / 60);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
  return `${Math.round(h / 24)} days`;
}

/** The separation word as a plain answer to "is there a clear winner?". */
const CLEAR_WINNER: Record<string, string> = {
  SEPARATED: "Yes",
  TIE: "No: a tie",
  UNTESTED: "Not tested yet",
};

/**
 * The x402 census in plain counts: ONE place that both the tiles and the card's sentence read.
 * "Gone or not answering" is the snapshot producer's own "phantom or unreachable" figure
 * (scripts/catalog-trust-round.py: dead_404_or_unreachable + other_error), so the tile, the
 * sentence and the snapshot's headline all print the same number. Tools audit retest, 6 Oct
 * 2026: the tile printed dead_404_or_unreachable alone (15) beside a headline of 16.
 */
export function x402Counts(o: Obj): { tried: number | null; askCorrectly: number | null; goneOrNotAnswering: number | null } {
  const c = rec(o.counts);
  const dead = num(c?.dead_404_or_unreachable);
  const other = num(c?.other_error);
  return {
    tried: num(c?.total),
    askCorrectly: num(c?.challenge_402),
    goneOrNotAnswering: dead === null ? null : dead + (other ?? 0),
  };
}

/**
 * Per-tool tiles: the fields a stranger needs from each tool, in plain words. Each reads only
 * fields the tool returned; a missing field drops its tile, it is never filled in.
 */
const TILE_SPECS: Record<string, (o: Obj) => StatTile[]> = {
  get_axis: (o) => {
    const t: StatTile[] = [];
    const n = num(o.n);
    if (n !== null) t.push({ key: "n", label: "Questions", value: fmt(n) });
    const acc = num(o.accuracy);
    if (acc !== null) {
      const iv = Array.isArray(o.interval) && o.interval.length === 2 ? o.interval.map(num) : null;
      // The range is widened outward when rounded, never narrowed.
      const range = iv && iv[0] !== null && iv[1] !== null ? `range ${Math.floor(iv[0] * 100)}–${pct(iv[1], Math.ceil)}` : undefined;
      t.push({ key: "accuracy", label: "Best score", value: pct(acc), hint: range });
    }
    if (typeof o.separation === "string" && o.separation) {
      const s = o.separation.toUpperCase();
      t.push({ key: "separation", label: "Clear winner?", value: CLEAR_WINNER[s] ?? o.separation });
    }
    const top =
      typeof o.leader === "string" && o.leader
        ? o.leader
        : typeof o.top_observed_not_separated === "string" && o.top_observed_not_separated
          ? o.top_observed_not_separated
          : null;
    if (top) t.push({ key: "top", label: "Highest observed", value: top });
    return t;
  },
  board_totals: (o) => {
    const list = Array.isArray(o.counts) ? o.counts.map(rec) : [];
    const flat = rec(o.counts);
    const count = (name: string) => {
      const row = list.find((r) => r?.name === name);
      return row ? num(row.value) : flat ? num(flat[name]) : null;
    };
    const sep = rec(o.separation);
    const t: StatTile[] = [];
    const slots = count("axis_slots");
    const measured = count("measured");
    if (slots !== null) t.push({ key: "axis_slots", label: "Tests on the board", value: fmt(slots) });
    if (measured !== null) t.push({ key: "measured", label: "With results", value: fmt(measured) });
    const leads = num(sep?.separated_leads);
    const ties = num(sep?.ties);
    if (leads !== null) t.push({ key: "separated_leads", label: "Clear winners", value: fmt(leads) });
    if (ties !== null) t.push({ key: "ties", label: "Ties", value: fmt(ties) });
    return t;
  },
  list_cards: (o) => {
    // Two corpora, two labels, never added together (council-os/CARD-CORPORA.md).
    const idx = rec(o.index);
    const store = rec(o.card_store_count_endpoint);
    const t: StatTile[] = [];
    const declared = num(idx?.n_cards_declared);
    if (declared !== null) t.push({ key: "index.n_cards_declared", label: "Cards in index", value: fmt(declared) });
    const reported = num(store?.count);
    if (reported !== null) t.push({ key: "card_store_count_endpoint.count", label: "Store reports", value: fmt(reported) });
    const rows = Array.isArray(o.rows) ? o.rows.map(rec) : [];
    const carried = num(idx?.rows_carried);
    // "Newest" only when every row came back; otherwise the newest of a page is not the newest card.
    const newest = rows.length && carried !== null && rows.length >= carried ? latestDay(rows.map((r) => r?.ts)) : null;
    if (newest) t.push({ key: "rows.ts", label: "Newest", value: newest });
    else {
      const packaged = day(idx?.packaged_at);
      if (packaged) t.push({ key: "index.packaged_at", label: "Index updated", value: packaged });
    }
    return t;
  },
  server_evidence: (o) => {
    const n = num(o.n_capsules);
    if (n === null) return [];
    const t: StatTile[] = [{ key: "n_capsules", label: "Checks", value: fmt(n) }];
    const caps = Array.isArray(o.capsules) ? o.capsules.map(rec) : [];
    if (n > 0) {
      let consistent: number | null = null;
      if (caps.length) consistent = caps.filter((c) => c?.measurement_state === "CONSISTENT").length;
      else {
        const by = rec(o.by_adapter);
        if (by) consistent = Object.values(by).reduce<number>((s, v) => s + (num(rec(v)?.CONSISTENT) ?? 0), 0);
      }
      if (consistent !== null) t.push({ key: "consistent", label: "Consistent", value: fmt(consistent) });
      const last = latestDay(caps.map((c) => c?.observed_at)) ?? day(o.as_of);
      if (last) t.push({ key: "last_checked", label: "Last checked", value: last });
    } else {
      const asOf = day(o.as_of);
      if (asOf) t.push({ key: "as_of", label: "Records as of", value: asOf });
    }
    return t;
  },
  verify_card: (o) => {
    const checks = Array.isArray(o.checks) ? o.checks.map(rec).filter((c): c is Obj => Boolean(c)) : [];
    // A check with ok:null is a note (e.g. frozen framing), not a pass or a fail.
    const decided = checks.filter((c) => c.ok === true || c.ok === false);
    const t: StatTile[] = [];
    if (decided.length) {
      const passed = decided.filter((c) => c.ok === true).length;
      const notes = checks.length - decided.length;
      t.push({
        key: "checks",
        label: "Checks passed",
        value: `${passed}/${decided.length}`,
        hint: notes ? `${notes} more noted, not pass or fail` : undefined,
      });
    }
    const valid = String(o.state ?? "").toUpperCase() === "VALID";
    if (valid && typeof o.pinned_key === "string" && /^did:web:csoai\.org#/.test(o.pinned_key))
      t.push({ key: "pinned_key", label: "Signed by", value: "Council of AI", hint: o.pinned_key.replace(/^did:web:csoai\.org#/, "key ") });
    const signed = day(o.signed_on ?? o.created ?? o.signed_at);
    if (valid && signed) t.push({ key: "signed_on", label: "Signed on", value: signed });
    return t;
  },
  get_root: (o) => {
    const t: StatTile[] = [];
    // Corpus 2 of three (the public root's leaves); named as such, never just "cards".
    const cards = num(o.card_count);
    if (cards !== null) t.push({ key: "card_count", label: "Cards under the root", value: fmt(cards) });
    const asOf = day(o.as_of);
    if (asOf) t.push({ key: "as_of", label: "Root dated", value: asOf });
    return t;
  },
  mcp_trust: (o) => {
    const c = rec(o.counts);
    const t: StatTile[] = [];
    const add = (key: string, label: string) => {
      const v = num(c?.[key]);
      if (v !== null) t.push({ key: `counts.${key}`, label, value: fmt(v) });
    };
    add("total", "Servers tried");
    add("initialize_ok_tools_listed", "Listed their tools");
    add("auth_challenged_401_403", "Asked for a login");
    const asOf = day(o.as_of);
    if (asOf) t.push({ key: "as_of", label: "Read on", value: asOf, hint: o.partial === true ? "partial round" : undefined });
    return t;
  },
  x402_trust: (o) => {
    const c = x402Counts(o);
    const t: StatTile[] = [];
    if (c.tried !== null) t.push({ key: "counts.total", label: "Paid doors tried", value: fmt(c.tried) });
    if (c.askCorrectly !== null) t.push({ key: "counts.challenge_402", label: "Ask for payment correctly", value: fmt(c.askCorrectly) });
    if (c.goneOrNotAnswering !== null)
      t.push({ key: "counts.dead_404_or_unreachable+other_error", label: "Gone or not answering", value: fmt(c.goneOrNotAnswering) });
    const asOf = day(o.as_of);
    if (asOf) t.push({ key: "as_of", label: "Read on", value: asOf });
    return t;
  },
  model_lookup: (o) => {
    const t: StatTile[] = [];
    const cards = num(o.cards);
    if (cards !== null) t.push({ key: "cards", label: "Signed results", value: fmt(cards) });
    const axes = num(o.axes);
    if (axes !== null) t.push({ key: "axes", label: "Test areas", value: fmt(axes) });
    if (typeof o.whose === "string" && o.whose) t.push({ key: "whose", label: "Whose model", value: o.whose.replace(/\s*\(.*\)$/, "") });
    return t;
  },
  corrections_summary: (o) => {
    const t: StatTile[] = [];
    const count = num(o.count);
    if (count !== null) t.push({ key: "count", label: "Corrections", value: fmt(count) });
    const recent = Array.isArray(o.recent) ? o.recent.map(rec) : [];
    const newest = latestDay(recent.map((r) => r?.date));
    if (newest) t.push({ key: "recent.date", label: "Newest", value: newest });
    const lat = rec(o.correction_latency);
    const median = num(lat?.median_seconds_exact);
    const exact = num(lat?.exact);
    if (median !== null && exact) {
      t.push({
        key: "correction_latency.median_seconds_exact",
        label: "Median fix time",
        value: plainDuration(median),
        hint: `over ${fmt(exact)} timed correction${exact === 1 ? "" : "s"}`,
      });
    }
    return t;
  },
};

/**
 * Up to `max` stat tiles from a tool's structured output, printed as returned. When `tool` has a
 * TILE_SPECS entry, its plain tiles are used; otherwise (or when it finds nothing) the generic
 * picker reads the top-level fields.
 */
export function statTiles(output: unknown, max = 4, tool?: string): StatTile[] {
  if (!output || typeof output !== "object" || Array.isArray(output)) return [];
  const o = output as Record<string, unknown>;
  if (tool && Object.prototype.hasOwnProperty.call(TILE_SPECS, tool)) {
    const spec = TILE_SPECS[tool](o).filter((t) => t.value);
    if (spec.length) return spec.slice(0, max);
  }
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

/**
 * One plain sentence for the face of an answer, built from the tiles statTiles() returns for the
 * same output, so the sentence and the tiles cannot print different numbers. null when the tool
 * has no plain sentence, or a tile it needs is missing; the caller then shows the answer's own
 * first sentence. Nothing is filled in.
 */
export function plainAnswer(tool: string, output: unknown): string | null {
  const o = rec(output);
  if (!o || !Object.prototype.hasOwnProperty.call(TILE_SPECS, tool)) return null;
  const tiles = TILE_SPECS[tool](o);
  const v = (key: string): string | null => tiles.find((t) => t.key === key)?.value ?? null;
  switch (tool) {
    case "x402_trust": {
      const tried = v("counts.total");
      const ok = v("counts.challenge_402");
      const gone = v("counts.dead_404_or_unreachable+other_error");
      if (!tried || !ok) return null;
      return `Of ${tried} paid doors we tried, ${ok} asked for payment correctly${gone ? ` and ${gone} were gone or not answering` : ""}.`;
    }
    case "mcp_trust": {
      const tried = v("counts.total");
      const listed = v("counts.initialize_ok_tools_listed");
      const login = v("counts.auth_challenged_401_403");
      if (!tried || !listed) return null;
      return `Of ${tried} MCP servers we tried, ${listed} listed their tools${login ? ` and ${login} asked for a login` : ""}${o.partial === true ? " (a partial round)" : ""}.`;
    }
    case "board_totals": {
      const slots = v("axis_slots");
      const measured = v("measured");
      if (!slots || !measured) return null;
      const leads = v("separated_leads");
      const ties = v("ties");
      const sep =
        leads === "0" && ties
          ? ` No test has a clear winner yet; ${ties} are ties.`
          : leads && ties
            ? ` ${leads} have a clear winner; ${ties} are ties.`
            : "";
      return `${measured} of the ${slots} tests on the board have published results.${sep}`;
    }
    case "get_axis": {
      const axis = typeof o.axis === "string" && o.axis ? o.axis.charAt(0).toUpperCase() + o.axis.slice(1) : null;
      const sepWord = typeof o.separation === "string" ? o.separation.toUpperCase() : "";
      const n = v("n");
      const best = v("accuracy");
      const top = v("top");
      if (!axis) return null;
      // UNTESTED is about the comparison (was any model shown to be clearly better?), not about
      // whether the axis has results: an UNTESTED axis can still carry n and a highest score.
      if (sepWord === "UNTESTED")
        return n && best
          ? `${axis}: the highest score observed was ${best}${top ? `, by ${top}` : ""}, over ${n} questions. Whether any model is clearly better has not been tested yet.`
          : `${axis}: whether any model is clearly better has not been tested yet.`;
      if (!n || !best) return null;
      if (sepWord === "SEPARATED" && top) return `${axis}: ${top} is clearly ahead, at ${best} over ${n} questions.`;
      if (sepWord === "TIE")
        return `${axis}: no model was clearly better (a tie). The highest score observed was ${best}${top ? `, by ${top}` : ""}, over ${n} questions.`;
      return `${axis}: the highest score observed was ${best}${top ? `, by ${top}` : ""}, over ${n} questions.`;
    }
    case "server_evidence": {
      const endpoint = typeof o.endpoint === "string" && o.endpoint.trim() ? o.endpoint.trim() : "this server";
      const n = v("n_capsules");
      if (n === null) return null;
      if (n === "0") return `We have no published checks for ${endpoint} yet.`;
      const consistent = v("consistent");
      const last = v("last_checked");
      return `${consistent ?? "Some"} of ${n} published checks on ${endpoint} were consistent${last ? `; the last was on ${last}` : ""}.`;
    }
    case "model_lookup": {
      const model = typeof o.model === "string" && o.model ? o.model : null;
      if (!model) return null;
      if (String(o.state ?? "").toUpperCase() === "NOT_MEASURED") return `Nothing is published about ${model} yet. That is not a finding either way.`;
      const cards = v("cards");
      const axes = v("axes");
      if (!cards) return null;
      return `${model} has ${cards} signed results on file${axes ? `, across ${axes} test areas` : ""}. A count, not a score or a safety verdict.`;
    }
    case "corrections_summary": {
      const count = v("count");
      const newest = v("recent.date");
      if (!count) return null;
      return `${count} corrections are published${newest ? `; the newest is dated ${newest}` : ""}.`;
    }
    case "get_root": {
      const cards = v("card_count");
      const dated = v("as_of");
      if (!cards) return null;
      return `${cards} cards sit under the public root${dated ? ` dated ${dated}` : ""}.`;
    }
    case "list_cards": {
      const declared = v("index.n_cards_declared");
      const store = v("card_store_count_endpoint.count");
      if (!declared) return null;
      return store && store !== declared
        ? `The signed index lists ${declared} cards. The live card store counts ${store}; the two are counted separately and never added.`
        : `The signed index lists ${declared} cards.`;
    }
    case "verify_card": {
      const checks = v("checks");
      const state = String(o.state ?? "").toUpperCase();
      if (!checks) return null;
      if (state === "VALID") return `Genuine: ${checks} checks passed${v("pinned_key") ? ", signed by Council of AI" : ""}.`;
      if (state === "INVALID") return `Not genuine: only ${checks} checks passed.`;
      return null;
    }
    default:
      return null;
  }
}

/**
 * One plain line for the card face naming what was actually looked up, when the tool resolved
 * the reader's words to something else (server_evidence turns "github.com" into
 * https://github.com/mcp). Read from the output; null when the tool did not say.
 */
export function checkedLine(tool: string, output: unknown): string | null {
  const o = rec(output);
  if (tool === "server_evidence" && o && typeof o.endpoint === "string" && o.endpoint.trim())
    return `We checked our published records for ${o.endpoint.trim()}`;
  return null;
}

/**
 * The first sentence of an answer, for the face of the panel; the rest goes behind each card's
 * expander. The "**tool** → STATE —" lead is dropped: the card already shows the tool and its chip.
 */
export function firstSentence(text: string): string {
  const line =
    text
      .split(/\n/)
      .map((l) => l.replace(/^-\s+/, "").replace(/\*\*|`/g, "").trim())
      .find((l) => l.length > 0) ?? "";
  const body = line
    .replace(/^[a-z0-9_]+\s*→\s*/i, "")
    .replace(/^[A-Z][A-Z0-9_]*(?:\s+\d+\s+of\s+\d+\s+\w+)?\s+—\s+/, "")
    .trim();
  const m = body.match(/^(.+?[.!?])(?=\s|$)/);
  const s = (m ? m[1] : body).trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

/**
 * The run's answer text split by tool: each "**tool** → …" block belongs to that tool's card.
 * Text before the first block, and the closing provenance line, go to every card.
 */
export function answerSections(text: string): { byTool: Record<string, string>; shared: string } {
  const byTool: Record<string, string> = {};
  const blocks = text.split(/\n{2,}/);
  const shared: string[] = [];
  let current: string | null = null;
  for (const b of blocks) {
    const m = b.match(/^\*\*([a-z0-9_]+)\*\*\s*→/i);
    if (m) {
      current = m[1];
      byTool[current] = byTool[current] ? `${byTool[current]}\n\n${b}` : b;
    } else if (current && !/^_.*_$/s.test(b.trim())) {
      byTool[current] = `${byTool[current]}\n\n${b}`;
    } else {
      shared.push(b);
    }
  }
  return { byTool, shared: shared.join("\n\n").trim() };
}

/**
 * Where "Verify yourself" goes for one tool result. A record with a 64-hex id opens in the
 * in-browser checker with that record loaded; a board, axis, card-index or corrections read opens
 * the page that renders the same source and says how to check it. Anything else keeps the cited
 * file (tools audit retest, 6 Oct 2026: "Verify yourself often opens a raw file").
 */
export function verifyLink(tool: string, output: unknown, recordId: string | null | undefined, citationUrl: string | null | undefined): string | null {
  const o = rec(output);
  const id = typeof recordId === "string" ? recordId.replace(/^sha256:/i, "") : "";
  if (["verify_card", "get_card", "verify_inclusion"].includes(tool) && /^[0-9a-f]{64}$/i.test(id))
    return `/dashboard?tab=verify&card=${id.toLowerCase()}`;
  if (tool === "get_axis" && o && typeof o.axis === "string" && /^[a-z0-9-]+$/.test(o.axis)) return `/axis/${o.axis}`;
  if (tool === "board_totals") return "/dashboard?tab=board";
  if (tool === "list_cards") return "/dashboard?tab=cards";
  if (tool === "corrections_summary") return "/dashboard?tab=corrections";
  // The list page renders the same /interop/models-measured.json, one anchored row per model.
  if (tool === "model_lookup" && o && typeof o.model === "string" && o.model)
    return String(o.state ?? "").toUpperCase() === "MEASURED" ? `/models-measured/#${modelAnchor(o.model)}` : "/models-measured/";
  // The MCP Trust Board renders the same /interop/mcp-trust/latest.json and links the file.
  if (tool === "mcp_trust") return "/boards/mcp/";
  return verifyHref(citationUrl);
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

/**
 * The one sentence about a fresh run, shared by Get results (step 2) and the Request a fresh run
 * pane: asking is free, and paying never buys a result.
 */
export const FRESH_RUN_DOCTRINE =
  "We can't run a new test on demand. You can ask for one: you see the terms first and nothing is charged by asking. Paying buys a signed receipt and a place in the queue, never a result; a result appears only once it is measured.";

/**
 * What a stranger typed: a signed record id, a server/web address, a question in words, or
 * (otherwise) a model name. Tools audit retest, 6 Oct 2026: every free text ("is gpt-4o safe?")
 * was looked up as a model name and came back "nothing published about 'is gpt-4o safe?'". A
 * sentence now goes to the Answers panel, which answers what the published records can answer and
 * says so plainly when they cannot. A model name has no question mark and no question word.
 */
export type SubjectKind = "record" | "server" | "model" | "question" | "empty";

const QUESTION_WORD = /^(is|are|was|were|what|what's|whats|how|which|who|whose|why|when|where|does|do|did|can|could|should|will|would|has|have|show|list|tell|explain|compare|find)\b/i;

export function classifySubject(raw: string): SubjectKind {
  const s = raw.trim();
  if (!s) return "empty";
  if (/^(sha256:)?[0-9a-f]{64}$/i.test(s)) return "record";
  if (/^https?:\/\//i.test(s)) return "server";
  if (/\?$/.test(s) || (/\s/.test(s) && QUESTION_WORD.test(s)) || s.split(/\s+/).length >= 4) return "question";
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
  if (kind === "question") return s;
  return null;
}

export type ModelRow = {
  id: string;
  kind?: string;
  cards?: number;
  axes?: number;
  name_published?: boolean;
  /** The model's first card in the signed card index (scripts/build-models-measured.mjs); null when it has none. */
  first_signed_card?: string | null;
};

/** The anchor of a model's row on /models-measured/ (the page and the Get results card share it). */
export function modelAnchor(id: string): string {
  return `model-${id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

/** Where "Verify yourself" goes for a model: its first signed card, checked in the browser. */
export function modelVerifyHref(row: Pick<ModelRow, "first_signed_card"> | null | undefined): string {
  const id = row?.first_signed_card;
  return typeof id === "string" && /^[0-9a-f]{64}$/i.test(id) ? `/dashboard?tab=verify&card=${id.toLowerCase()}` : "/dashboard?tab=verify";
}

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
