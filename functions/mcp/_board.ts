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
 * board_totals. The default answer is the SUMMARY: the three labelled counts, the board's own
 * public_count and separation line, the dates and the source — about 1,500 characters. It used to
 * return about 15,000 to answer two numbers, nearly all of it the board's measured_on block copied
 * into as_of (Anthropic Software Directory Policy 5.B: token use roughly commensurate with the
 * task). `detail: "full"` returns the previous payload unchanged, so no reader loses a field.
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
      more: 'Call again with detail: "full" for count_grammar, by_family and the board\'s full measured_on block.',
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
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
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
      cards?: { count?: number; signed?: number };
    };
    out.card_store_count_endpoint = {
      source: `${origin}/api/cards`,
      count: api?.cards?.count ?? null,
      signed: api?.cards?.signed ?? null,
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
    return { state: "VALID", sha256: sha, merkle_root: d.merkle_root ?? null, not_a_certification: true };
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
