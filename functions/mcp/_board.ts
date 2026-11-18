/**
 * Shared MCP tool handlers for Pages /mcp.
 * Definitions stay in ./gspc-tools.json (byte-for-byte with npm csoai-gspc-mcp).
 * Do not edit mcp/gspc-server — four-tool npm package stays honest.
 */
import { axisSpellings, canonicalAxis, sameAxis } from "./_axis";
import { corpusNote } from "../_lib/corpusNote";
import { isSeparated, leaderLabel } from "../_lib/leaderLabel";

export const UPSTREAM = "https://csoai-gspc-mcp.nicholastempleman.workers.dev/mcp";

/** Card URLs may be fetched only from the estate's own published origins. */
export const FETCHABLE_ORIGINS = ["https://councilof.ai/", "https://csoai.org/", "https://www.csoai.org/"];

/* ------------------------------------------------------------------------------
 * Shared MCP tools — GSPC four plus public-root get_root / get_card / verify_inclusion (seven).
 * Definitions come from ./gspc-tools.json (the ONE source, shared with the stdio
 * server in mcp/gspc-server); the handlers below mirror mcp/gspc-server/index.mjs
 * shape-for-shape so a client can switch transports without re-learning anything.
 * ---------------------------------------------------------------------------- */

export async function fetchOriginJson(origin: string, path: string): Promise<unknown> {
  const r = await fetch(`${origin}${path}`, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET ${origin}${path} returned HTTP ${r.status}`);
  return r.json();
}

export function isHttp404(e: unknown): boolean {
  return e instanceof Error && /HTTP 404\b/.test(e.message);
}

/** The distinct unreachable state — never a cached number presented as live. */
export function unreachablePayload(origin: string, path: string, e: unknown) {
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

/**
 * The board's date as one short string. /api/gspc `measured_on` is an object (fleet, endpoint,
 * grading notes and a signed living stamp — about 11,000 characters) whose `date` field is the
 * dates line; older payloads carried a plain string. Anything else is null, never invented.
 */
export function boardDateOf(measuredOn: unknown): string | null {
  if (typeof measuredOn === "string") return measuredOn;
  if (measuredOn && typeof measuredOn === "object" && !Array.isArray(measuredOn)) {
    const date = (measuredOn as Record<string, unknown>).date;
    if (typeof date === "string") return date;
  }
  return null;
}

/**
 * How old one measurement is, read from the board's own per-axis `measurement_time`
 * (functions/api/_gspc_measurement_time.ts): an EXACT instant, a DAY, or a NOT_AFTER upper bound;
 * a plain string is read as published. Fetch, build and deploy times never refresh a measurement,
 * so age runs from the evidence date to the UTC day of this read, in whole days, and two reads on
 * the same UTC day agree. The board sets no maximum age (measurement_time_contract), so this
 * reports age only and never calls a row CURRENT or STALE. A NOT_AFTER date bounds when the run
 * happened from above, so its age is a minimum.
 */
export type MeasurementAge = {
  evidence_date: string;
  precision: string;
  age_days: number;
  age_is_minimum: boolean;
};

/** The UTC calendar day of an ISO instant or of a bare YYYY-MM-DD; null when it is neither. */
export function utcDayOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (!/^\d{4}-\d{2}-\d{2}T/.test(text)) return null;
  const ms = Date.parse(text);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString().slice(0, 10);
}

function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000);
}

export function measurementAge(measurementTime: unknown, asOfDay: string): MeasurementAge | null {
  let day: string | null = null;
  let precision = "AS_PUBLISHED";
  let minimum = false;
  if (typeof measurementTime === "string") {
    day = utcDayOf(measurementTime);
  } else if (measurementTime && typeof measurementTime === "object" && !Array.isArray(measurementTime)) {
    const mt = measurementTime as Record<string, unknown>;
    precision = typeof mt.state === "string" ? mt.state : "UNKNOWN";
    if (mt.state === "EXACT") day = utcDayOf(mt.observed_at);
    else if (mt.state === "DAY") day = utcDayOf(mt.observed_on);
    else if (mt.state === "NOT_AFTER") {
      day = utcDayOf(mt.not_after);
      minimum = true;
    }
  }
  if (!day) return null;
  return { evidence_date: day, precision, age_days: daysBetween(day, asOfDay), age_is_minimum: minimum };
}

/** Reporting bands only: the board publishes no maximum age, so none of these is a verdict. */
export const AGE_BANDS = ["0-30", "31-90", "91+"] as const;

function ageBand(days: number): (typeof AGE_BANDS)[number] {
  return days <= 30 ? "0-30" : days <= 90 ? "31-90" : "91+";
}

export const AGE_BASIS = "each axis's measurement_time; fetch time never refreshes it";

/**
 * The board's measurement ages: the oldest and newest evidence dates, and how many measured axes
 * fall in each age band. MEASURED rows only: an unmeasured slot has no measurement to age and is
 * already counted as unmeasured. A measured row whose evidence carries no readable date is counted
 * in no_evidence_date and is never given one. The summary stays short (board_totals' default answer
 * is kept under 2,000 characters); `full` adds the read day, the board's age policy and one line
 * per measured axis.
 */
export function boardMeasurementAge(d: Record<string, unknown>, fetchedAt: string, detail: "summary" | "full") {
  const asOfDay = fetchedAt.slice(0, 10);
  const rows = (Array.isArray(d.axes) ? d.axes : []) as Record<string, unknown>[];
  const bands: Record<string, number> = { "0-30": 0, "31-90": 0, "91+": 0 };
  const perAxis: Record<string, unknown>[] = [];
  let noDate = 0;
  let oldest: string | null = null;
  let newest: string | null = null;
  for (const r of rows) {
    if (String(r.status ?? "").toUpperCase() !== "MEASURED") continue;
    const age = measurementAge(r.measurement_time, asOfDay);
    if (!age) {
      noDate += 1;
      perAxis.push({ axis: r.axis ?? null, evidence_date: null, precision: null, age_days: null, age_is_minimum: null });
      continue;
    }
    bands[ageBand(age.age_days)] += 1;
    if (oldest === null || age.evidence_date < oldest) oldest = age.evidence_date;
    if (newest === null || age.evidence_date > newest) newest = age.evidence_date;
    perAxis.push({ axis: r.axis ?? null, ...age });
  }
  const contract = (d.measurement_time_contract ?? null) as Record<string, unknown> | null;
  return {
    oldest,
    newest,
    axes_by_age_days: bands,
    no_evidence_date: noDate,
    basis: AGE_BASIS,
    ...(detail === "full"
      ? {
          age_as_of_day: asOfDay,
          max_age_policy: contract?.global_freshness_policy ?? null,
          note:
            "Age only, in whole UTC days from each axis's evidence date to the day of this read. The board sets no maximum age, so no row is called CURRENT or STALE here. A NOT_AFTER date is an upper bound on when the run happened, so its age is a minimum (age_is_minimum).",
          per_axis: perAxis,
        }
      : {}),
  };
}

/**
 * board_totals. The default answer is the SUMMARY: the three labelled counts, the board's own
 * public_count and separation line, the dates, how old the measurements are (measurement_age) and
 * the source — under 2,000 characters. It used to return about 15,000 to answer two numbers, nearly
 * all of it the board's measured_on block copied into as_of (Anthropic Software Directory Policy
 * 5.B: token use roughly commensurate with the task). `detail: "full"` returns the previous payload
 * plus measurement_age with one line per measured axis, so no reader loses a field.
 */
export async function boardTotalsTool(origin: string, args: Record<string, unknown> = {}) {
  let d: Record<string, unknown>;
  try {
    d = (await fetchOriginJson(origin, "/api/gspc")) as Record<string, unknown>;
  } catch (e) {
    return unreachablePayload(origin, "/api/gspc", e);
  }
  const t = (d.totals ?? {}) as Record<string, unknown>;
  const fetched_at = new Date().toISOString();
  const counts = [
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
  ];
  if (args.detail !== "full") {
    return {
      state: "LIVE",
      reachable: true,
      kind: "live-board-totals",
      detail: "summary",
      source: `${origin}/api/gspc`,
      as_of: { board_measured_on: boardDateOf(d.measured_on), fetched_at },
      counts,
      public_count: t.public_count ?? null,
      separation: {
        public_count: t.separation_public_count ?? null,
        comparison_axes: t.comparison_axes ?? null,
        separated_leads: t.separated_leads ?? null,
        ties: t.ties ?? null,
        untested: t.untested_separations ?? null,
        note: "A measured axis is not a separated leader: separation is a separate determination, and TIE and UNTESTED are not folded into it.",
      },
      measurement_age: boardMeasurementAge(d, fetched_at, "summary"),
      more: 'Call again with detail: "full" for count_grammar, by_family, the full measured_on block and per-axis ages.',
      not_a_certification: true,
    };
  }
  return {
    state: "LIVE",
    reachable: true,
    kind: "live-board-totals",
    detail: "full",
    source: `${origin}/api/gspc`,
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at },
    counts,
    count_grammar: t.count_grammar ?? null,
    public_count: t.public_count ?? null,
    by_family: t.by_family ?? null,
    measurement_age: boardMeasurementAge(d, fetched_at, "full"),
    not_a_certification: true,
  };
}

export async function getAxisTool(origin: string, args: Record<string, unknown>) {
  const asked = String(args.axis ?? "").trim();
  if (!asked) return { state: "BAD_INPUT", error: "pass an axis name, e.g. governance" };
  // Canonical ids and their aliases (gov, gspc-governance, …), case-insensitive — ./axis-aliases.json.
  const wanted = canonicalAxis(asked);
  let d: Record<string, unknown>;
  try {
    d = (await fetchOriginJson(origin, "/api/gspc")) as Record<string, unknown>;
  } catch (e) {
    return unreachablePayload(origin, "/api/gspc", e);
  }
  const rows = (d.axes ?? []) as Record<string, unknown>[];
  const row = rows.find((r) => sameAxis(r.axis, wanted));
  if (!row) {
    return {
      state: "NOT_ON_BOARD",
      axis: asked,
      note: "This name is not a row on the live board. That is a fact about the board, not a verdict about the subject.",
      board_carries: rows.map((r) => r.axis),
      as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    };
  }
  const measured = String(row.status ?? "").toUpperCase() === "MEASURED";
  // A row is a leader only when separation SEPARATED it (functions/_lib/leaderLabel.ts). On a TIE or
  // UNTESTED axis the board's top row is the top observed point estimate, so it is returned under that
  // name and `leader` stays null. separation is copied so a caller can see why.
  const topName = typeof row.leader === "string" && row.leader.trim() ? row.leader : null;
  const separated = isSeparated(row.separation);
  const fetched_at = new Date().toISOString();
  return {
    state: "LIVE",
    axis: row.axis,
    ...(asked.toLowerCase() !== String(row.axis).toLowerCase() ? { resolved_from: asked } : {}),
    family: row.family ?? null,
    status: row.status ?? null,
    measured,
    measured_note: measured
      ? "a real run stands behind this row"
      : "a declared slot with no run behind it — published so the gap is visible; first-class, not an error and not a zero",
    n: row.n ?? null,
    accuracy: row.accuracy ?? null,
    interval: row.interval ?? null,
    separation: row.separation ?? null,
    leader: separated ? topName : null,
    top_observed_not_separated: separated ? null : topName,
    leader_label: topName ? leaderLabel(row.separation) : null,
    dataset: row.dataset ?? null,
    // The doors behind the row, copied from it: a model-comparison axis carries a frozen bank on
    // the Hub, a deterministic-facts axis carries a run artifact, and a row that carries neither
    // returns null for both rather than an invented URL. row_url is the same board filtered to
    // this one axis, so a caller can re-fetch exactly what this tool read.
    kind: row.kind ?? null,
    dataset_url: row.dataset_url ?? null,
    evidence_url: typeof row.evidence_url === "string" && row.evidence_url.startsWith("/")
      ? `${origin}${row.evidence_url}` : (row.evidence_url ?? null),
    row_url: `${origin}/api/gspc?axis=${encodeURIComponent(String(row.axis))}`,
    note: row.note ?? null,
    // Preserve per-axis measurement provenance; board/retrieval dates do not refresh it.
    facts_as_of: row.facts_as_of ?? null,
    measurement_time: row.measurement_time ?? null,
    // How old that evidence is on the day of this read. Null for an unmeasured slot (nothing to
    // age) and for a measured row whose evidence carries no readable date (never invented).
    measurement_age: measured ? measurementAge(row.measurement_time, fetched_at.slice(0, 10)) : null,
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at },
    source: `${origin}/api/gspc`,
    not_a_certification: true,
  };
}

/** A 64-hex card id: the signed card index's `card` field, and a public-root leaf's sha256. */
export const CARD_ID_RE = /^[0-9a-f]{64}$/;

/** Where the signed body of a signed-card-index row is served: /signed/cards/{id}.json. */
export function signedCardPath(id: string): string {
  return `/signed/cards/${id}.json`;
}

/** Absolute card_url for an index row: the row's own card_url when it carries one. */
export function signedCardUrl(origin: string, row: Record<string, unknown>): string | null {
  const own = typeof row.card_url === "string" ? row.card_url : null;
  if (own) return own.startsWith("/") ? `${origin}${own}` : own;
  const id = typeof row.card === "string" ? row.card.toLowerCase() : "";
  return CARD_ID_RE.test(id) ? `${origin}${signedCardPath(id)}` : null;
}

export async function listCardsTool(origin: string, args: Record<string, unknown>) {
  const out: Record<string, unknown> = {
    // The read state of the signed card index, set below from whether it was fetched: LIVE (read
    // now) or UNREACHABLE. It says the listing is current, NOT that any row's signature was checked
    // here — verify_card does that, one card at a time.
    state: "UNREACHABLE",
    state_basis:
      "LIVE = /signed/card_index.json was read on this call; UNREACHABLE = it could not be. Listing is not verification: run verify_card on a row to check its signature.",
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
    // The index spells axes its own way ("gov", "gspc-governance"); the board says "governance".
    // Both, and any case, resolve through ONE alias table, so a board name finds its index rows.
    const wanted = args.axis ? canonicalAxis(args.axis) : null;
    const limit = Number.isInteger(args.limit) ? (args.limit as number) : 10;
    if (wanted) {
      const matched = [...new Set(rows.map((r) => String(r.axis ?? "")).filter((a) => sameAxis(a, wanted)))].sort();
      out.axis_query = {
        asked: String(args.axis),
        canonical: wanted,
        spellings: axisSpellings(wanted),
        index_names_matched: matched,
        note: "rows whose index axis name resolves to the same axis under functions/mcp/axis-aliases.json; each row keeps the index's own spelling",
      };
    }
    out.rows = rows
      .filter((r) => !wanted || sameAxis(r.axis, wanted))
      .slice()
      .sort((a, b) => String(b.ts ?? "").localeCompare(String(a.ts ?? "")))
      .slice(0, limit)
      // card_url: the signed body, absolute, so the row can go straight into verify_card (which
      // also takes the bare 64-hex id). Read from the row when the index carries it; otherwise
      // the one path the index's own card_url rule uses.
      .map((r) => ({ card: r.card, card_url: signedCardUrl(origin, r), axis: r.axis, ts: r.ts, signed: r.signed }));
    out.state = "LIVE";
  } catch (e) {
    out.index = unreachablePayload(origin, "/signed/card_index.json", e);
  }
  try {
    const api = (await fetchOriginJson(origin, "/api/cards")) as {
      cards?: { count?: number; signed?: number; signed_under_did_key?: number };
      cross_border?: unknown;
      note?: unknown;
    };
    // /api/cards defines its own count: the signed card index rows PLUS the cross-border East-West
    // card when it is published (functions/api/cards.ts; a separate schema, never folded into the
    // GSPC index per BOARD-RULING.md). Carry that from the endpoint's own fields, read live, so a
    // one-card difference is read as what the endpoint says it is. Still two numbers, never
    // reconciled here: this tool quotes the endpoint's definition and adjusts neither count.
    const note = typeof api?.note === "string" ? api.note : "";
    const firstSentence = note.split(/(?<=\.)\s/)[0] || null;
    out.card_store_count_endpoint = {
      source: `${origin}/api/cards`,
      count: api?.cards?.count ?? null,
      signed: api?.cards?.signed ?? null,
      signed_under_did_key: api?.cards?.signed_under_did_key ?? null,
      includes_cross_border_card: api?.cross_border != null,
      count_definition_as_published: firstSentence,
    };
  } catch (e) {
    out.card_store_count_endpoint = unreachablePayload(origin, "/api/cards", e);
  }
  return out;
}

export async function getRootTool(origin: string) {
  try {
    const d = (await fetchOriginJson(origin, "/root.json")) as Record<string, unknown>;
    return {
      state: "VALID",
      source: `${origin}/root.json`,
      kind: d.kind ?? null,
      as_of: d.as_of ?? null,
      card_count: d.card_count ?? null,
      merkle_root: d.merkle_root ?? null,
      note: d.note ?? null,
      not_a_certification: true,
      not_gspc: true,
    };
  } catch (e) {
    return { ...unreachablePayload(origin, "/root.json", e), state: "UNREACHABLE", not_gspc: true };
  }
}

/** partial = the snapshot says so OR its enumeration did not complete (a cap is not completion). */
export function partialOf(d: Record<string, unknown>): { partial: boolean; partial_reason: string | null } {
  const e = (d.enumeration ?? {}) as Record<string, unknown>;
  if (d.partial === true) return { partial: true, partial_reason: String(e.stop_reason ?? "the snapshot marks itself partial") };
  if (e.complete === false) {
    const seen = e.rows_with_remote ?? e.registry_rows_seen;
    return {
      partial: true,
      partial_reason: `enumeration incomplete: ${String(e.stop_reason ?? "stopped early")}${
        e.unique_hosts != null && seen != null ? ` (${e.unique_hosts} hosts probed of ${seen} registry rows with a remote)` : ""
      }`,
    };
  }
  return { partial: false, partial_reason: null };
}

export async function mcpTrustTool(origin: string) {
  try {
    const d = (await fetchOriginJson(origin, "/interop/mcp-trust/latest.json")) as Record<string, unknown>;
    return {
      state: "VALID",
      source: `${origin}/interop/mcp-trust/latest.json`,
      kind: d.kind ?? null,
      as_of: d.as_of ?? null,
      // A CAP-LIMITED READ IS PARTIAL. The snapshot of 2026-09-14 says partial:false while its own
      // enumeration says complete:false, stop_reason "cap reached" (500 of 1,854 hosts): the
      // producer counted a cap as a deliberate slice. Read it from the enumeration, not the flag.
      ...partialOf(d),
      enumeration: d.enumeration ?? null,
      counts: d.counts ?? null,
      headline: d.headline ?? null,
      diff: d.diff ?? null,
      not_a_certification: true,
    };
  } catch (e) {
    return { ...unreachablePayload(origin, "/interop/mcp-trust/latest.json", e), state: "UNREACHABLE" };
  }
}

export async function x402TrustTool(origin: string) {
  try {
    const d = (await fetchOriginJson(origin, "/interop/x402-trust/latest.json")) as Record<string, unknown>;
    return {
      state: "VALID",
      source: `${origin}/interop/x402-trust/latest.json`,
      kind: d.kind ?? null,
      as_of: d.as_of ?? null,
      counts: d.counts ?? null,
      headline: d.headline ?? null,
      not_a_certification: true,
    };
  } catch (e) {
    return { ...unreachablePayload(origin, "/interop/x402-trust/latest.json", e), state: "UNREACHABLE" };
  }
}

/**
 * get_card reads ONE corpus: the public-root card-v0 leaves (corpus 2 of three in
 * council-os/CARD-CORPORA.md). The signed card index (corpus 3) is a separate set with zero
 * identifier overlap, and its ids are the ones the home page shows as "record id". Until
 * 2026-09-28 a signed-index id reached the 404 branch here and was answered INVALID ("not a leaf
 * of the live root") — a genuine, verifying card called invalid by our own tool (public audit fix
 * #3). The corpora are never merged or reconciled here: a signed-index id is answered
 * NOT_IN_THIS_CORPUS, a fact about which set it belongs to and not a verdict about the card, and
 * the caller is pointed at verify_card. INVALID is kept for an id that is in neither set, and is
 * only reached once both the signed index and the live root's inclusion endpoint have answered.
 */
export const NOT_IN_THIS_CORPUS_REASON = "This id is in the signed card index, not the public root. Use verify_card.";

type Membership = { state: "IN" | "OUT" } | { state: "UNREACHABLE"; source: string; error: string };

/** Is `id` a row of the signed card index? Reads /signed/card_index.json; never guesses. */
export async function signedIndexMembership(origin: string, id: string): Promise<Membership & { row?: Record<string, unknown> }> {
  try {
    const idx = (await fetchOriginJson(origin, "/signed/card_index.json")) as Record<string, unknown>;
    const rows = (Array.isArray(idx.cards) ? idx.cards : []) as Record<string, unknown>[];
    const row = rows.find((r) => String(r.card ?? "").toLowerCase() === id);
    return row ? { state: "IN", row } : { state: "OUT" };
  } catch (e) {
    return { state: "UNREACHABLE", source: `${origin}/signed/card_index.json`, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Is `sha` a leaf of the live public root? Reads /api/proof?sha= (the verify_inclusion source). */
async function liveRootMembership(origin: string, sha: string): Promise<Membership> {
  const path = `/api/proof?sha=${sha}`;
  try {
    const d = (await fetchOriginJson(origin, path)) as Record<string, unknown>;
    if (d.kind === "inclusion") return { state: "IN" };
    if (d.error === "not_found") return { state: "OUT" };
    return { state: "UNREACHABLE", source: `${origin}${path}`, error: String(d.reason ?? "unexpected proof body") };
  } catch (e) {
    if (isHttp404(e)) return { state: "OUT" };
    return { state: "UNREACHABLE", source: `${origin}${path}`, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getCardTool(origin: string, args: Record<string, unknown>) {
  const sha = String(args.sha256 || "").trim().toLowerCase();
  if (!CARD_ID_RE.test(sha)) {
    return { state: "UNCHECKABLE", reason: "sha256 must be 64 hex", not_a_certification: true };
  }
  const source = `${origin}/cards/${sha.slice(0, 16)}.json`;
  try {
    const d = (await fetchOriginJson(origin, `/cards/${sha.slice(0, 16)}.json`)) as Record<string, unknown>;
    const card = (d.card || d) as Record<string, unknown>;
    const match = String(card.sha256 || "") === sha;
    return {
      state: match ? "VALID" : "INVALID",
      sha256: sha,
      source,
      surface: card.surface ?? null,
      unmeasured: card.unmeasured ?? [],
      sig_ed25519: card.sig_ed25519 ?? null,
      not_a_certification: true,
      not_gspc: true,
    };
  } catch (e) {
    if (!isHttp404(e)) {
      return { ...unreachablePayload(origin, `/cards/${sha.slice(0, 16)}.json`, e), state: "UNCHECKABLE", sha256: sha };
    }
  }
  // No public-root wrapper under that id. Before any INVALID, ask the other corpus by name.
  const signed = await signedIndexMembership(origin, sha);
  if (signed.state === "IN") {
    return {
      state: "NOT_IN_THIS_CORPUS",
      sha256: sha,
      reason: NOT_IN_THIS_CORPUS_REASON,
      corpus: "signed_card_index",
      card_url: signedCardUrl(origin, signed.row ?? { card: sha }),
      next: { tool: "verify_card", arguments: { card: sha } },
      source,
      note: "The public-root leaves and the signed card index are separate sets with no id in common. This tool reads the public-root leaves only, so this answer says which set the id belongs to, not whether the card verifies.",
      not_a_certification: true,
      not_gspc: true,
    };
  }
  if (signed.state === "UNREACHABLE") {
    return {
      state: "UNCHECKABLE",
      sha256: sha,
      reason: `no public-root wrapper at ${source} (HTTP 404), and the signed card index could not be read to rule it out (${signed.error}). Could not check is not INVALID.`,
      source,
      not_a_certification: true,
      not_gspc: true,
    };
  }
  const root = await liveRootMembership(origin, sha);
  if (root.state === "IN") {
    return {
      state: "UNCHECKABLE",
      sha256: sha,
      reason: `a leaf of the live root, but its wrapper at ${source} answered HTTP 404. The leaf is included; its body could not be fetched. Use verify_inclusion for the proof.`,
      source,
      not_a_certification: true,
      not_gspc: true,
    };
  }
  if (root.state === "UNREACHABLE") {
    return {
      state: "UNCHECKABLE",
      sha256: sha,
      reason: `no public-root wrapper at ${source} (HTTP 404), and the live root's inclusion endpoint could not be read (${root.error}). Could not check is not INVALID.`,
      source,
      not_a_certification: true,
      not_gspc: true,
    };
  }
  return {
    state: "INVALID",
    sha256: sha,
    reason: "not a leaf of the live root, and not in the signed card index",
    source,
    not_a_certification: true,
    not_gspc: true,
  };
}

const HEX64 = /^[0-9a-f]{64}$/;

function hexBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return out;
}

function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** root.json node_definition: parent = sha256(left || right) over RAW 32-byte digests, no prefix. */
async function parentOf(left: Uint8Array, right: Uint8Array): Promise<Uint8Array> {
  const both = new Uint8Array(64);
  both.set(left, 0);
  both.set(right, 32);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", both));
}

/** Walk an inclusion path bottom-up: an even index is the left child, an odd one the right. */
export async function rootFromPath(leaf: string, index: number, path: string[]): Promise<string> {
  let node = hexBytes(leaf);
  let at = index;
  for (const sibling of path) {
    const s = hexBytes(sibling);
    node = at % 2 === 0 ? await parentOf(node, s) : await parentOf(s, node);
    at = Math.floor(at / 2);
  }
  return bytesHex(node);
}

/** The same tree from the whole leaf list: an odd node at any level is paired WITH ITSELF. */
export async function rootFromLeaves(leaves: string[]): Promise<string | null> {
  if (leaves.length === 0) return null;
  let level = leaves.map(hexBytes);
  while (level.length > 1) {
    if (level.length % 2 === 1) level.push(level[level.length - 1]);
    const next: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) next.push(await parentOf(level[i], level[i + 1]));
    level = next;
  }
  return bytesHex(level[0]);
}

/**
 * An inclusion answer counts only if it reaches the merkle_root published in /root.json, the root
 * get_root reads. Until 17 Nov 2026 this tool said VALID whenever /api/proof answered
 * kind:"inclusion", without walking the path. /proofs/* redirects to a Hugging Face mirror that
 * still held the previous root's paths, so 59 of 76 sampled leaves were VALID against a root that
 * nothing publishes, and the Academy inclusion exercise failed for learners. A served path that
 * does not reach the published root is set aside, and the published leaf list decides instead.
 */
async function publishedRootInclusion(origin: string, sha: string, d: Record<string, unknown>) {
  let root: Record<string, unknown>;
  try {
    root = (await fetchOriginJson(origin, "/root.json")) as Record<string, unknown>;
  } catch (e) {
    return {
      ...unreachablePayload(origin, "/root.json", e),
      state: "UNCHECKABLE",
      sha256: sha,
      reason: "the proof endpoint answered, but /root.json could not be read, so the path was not checked against the published root. Could not check is not VALID.",
    };
  }
  const published = String(root.merkle_root ?? "").toLowerCase();
  const count = typeof root.card_count === "number" ? root.card_count : 0;
  const base = { sha256: sha, merkle_root: HEX64.test(published) ? published : null, card_count: count || null, as_of: root.as_of ?? null };
  if (!HEX64.test(published) || count < 1) {
    return { ...base, state: "UNCHECKABLE", reason: "/root.json carries no 64-hex merkle_root and positive card_count to check a path against.", not_a_certification: true };
  }
  const index = Number.isInteger(d.index) && (d.index as number) >= 0 ? (d.index as number) : null;
  const path = Array.isArray(d.proof) && d.proof.every((p) => HEX64.test(String(p).toLowerCase())) ? d.proof.map((p) => String(p).toLowerCase()) : null;
  const reaches = index !== null && path !== null && (await rootFromPath(sha, index, path)) === published;
  // The signed card_count bounds the tree: a path at or past it points into the duplicated tail.
  const inBound = index !== null && index < count;
  if (reaches && inBound) {
    return { ...base, state: "VALID", index, checked: "the served path recomputes to the merkle_root in /root.json, at an index below its card_count", not_a_certification: true };
  }
  const served_proof = {
    index,
    merkle_root: typeof d.merkle_root === "string" ? d.merkle_root : null,
    reaches_published_root: reaches,
    index_below_card_count: inBound,
    note: reaches
      ? "GET /api/proof served an index at or past card_count, the duplicated tail of an odd-paired tree, so its path proves nothing. This answer does not rely on it."
      : "GET /api/proof served a path that does not recompute to the merkle_root in /root.json. This answer does not rely on it.",
  };
  const leaves = Array.isArray(root.card_sha256) ? root.card_sha256.map((x) => String(x).toLowerCase()) : null;
  if (!leaves || leaves.length !== count || !leaves.every((l) => HEX64.test(l)) || (await rootFromLeaves(leaves)) !== published) {
    return {
      ...base,
      state: "UNCHECKABLE",
      reason: "the served path does not reach the published root, and the leaf list in /root.json is absent or does not recompute to its merkle_root, so inclusion could not be checked.",
      served_proof,
      not_a_certification: true,
    };
  }
  const at = leaves.indexOf(sha);
  if (at >= 0) {
    return { ...base, state: "VALID", index: at, checked: "recomputed from the leaf list in /root.json, which hashes to its merkle_root", served_proof, not_a_certification: true };
  }
  const note = await corpusNote(sha, (p) => fetch(`${origin}${p}`), { card_count: count, as_of: typeof root.as_of === "string" ? root.as_of : null });
  return { ...base, state: "INVALID", reason: "not in the leaf list of /root.json", served_proof, ...note, not_a_certification: true };
}

export async function verifyInclusionTool(origin: string, args: Record<string, unknown>) {
  const sha = String(args.sha256 || "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    return { state: "UNCHECKABLE", reason: "sha256 must be 64 hex", not_a_certification: true };
  }
  const path = `/api/proof?sha=${sha}`;
  let status = 0;
  let d: Record<string, unknown> | null = null;
  try {
    const r = await fetch(`${origin}${path}`, { headers: { accept: "application/json" } });
    status = r.status;
    try {
      d = (await r.json()) as Record<string, unknown>;
    } catch {
      d = null;
    }
    if (!r.ok && status !== 404) throw new Error(`GET ${origin}${path} returned HTTP ${status}`);
  } catch (e) {
    return { ...unreachablePayload(origin, path, e), state: "UNCHECKABLE", sha256: sha };
  }
  if (status === 200 && d?.kind === "inclusion") {
    return publishedRootInclusion(origin, sha, d);
  }
  if (status === 404 || d?.error === "not_found") {
    // INVALID stays INVALID (the enum is fixed). The corpus note says what it means: not a leaf of
    // THIS root, which covers one corpus only. /api/proof carries it; an older deploy that does not
    // is answered with the same helper, so the sentence never depends on which side shipped first.
    const note =
      d && typeof d.corpus_note === "string"
        ? {
            corpus: d.corpus,
            corpus_note: d.corpus_note,
            ...(d.verify_with ? { verify_with: d.verify_with } : {}),
            ...(d.mill_card_root ? { mill_card_root: d.mill_card_root } : {}),
            ...(d.anchoring ? { anchoring: d.anchoring } : {}),
          }
        : await corpusNote(sha, (p) => fetch(`${origin}${p}`), {
            card_count: typeof d?.card_count === "number" ? d.card_count : null,
            as_of: typeof d?.as_of === "string" ? d.as_of : null,
          });
    return {
      state: "INVALID",
      sha256: sha,
      reason: (d?.reason as string) ?? "not a leaf",
      merkle_root: d?.merkle_root ?? null,
      ...note,
      not_a_certification: true,
    };
  }
  return { state: "UNCHECKABLE", sha256: sha, reason: d?.reason ?? "unexpected proof body", not_a_certification: true };
}
