/**
 * Shared MCP tool handlers for Pages /mcp.
 * Definitions stay in ./gspc-tools.json (byte-for-byte with npm csoai-gspc-mcp).
 * Do not edit mcp/gspc-server — four-tool npm package stays honest.
 */
import { axisSpellings, canonicalAxis, sameAxis } from "./_axis";

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

export async function boardTotalsTool(origin: string) {
  let d: Record<string, unknown>;
  try {
    d = (await fetchOriginJson(origin, "/api/gspc")) as Record<string, unknown>;
  } catch (e) {
    return unreachablePayload(origin, "/api/gspc", e);
  }
  const t = (d.totals ?? {}) as Record<string, unknown>;
  return {
    state: "LIVE",
    reachable: true,
    kind: "live-board-totals",
    source: `${origin}/api/gspc`,
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    counts: [
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
    ],
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
    leader: row.leader ?? null,
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

export async function listCardsTool(origin: string, args: Record<string, unknown>) {
  const out: Record<string, unknown> = {
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
      .map((r) => ({ card: r.card, axis: r.axis, ts: r.ts, signed: r.signed }));
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

export async function getCardTool(origin: string, args: Record<string, unknown>) {
  const sha = String(args.sha256 || "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    return { state: "UNCHECKABLE", reason: "sha256 must be 64 hex", not_a_certification: true };
  }
  try {
    const d = (await fetchOriginJson(origin, `/cards/${sha.slice(0, 16)}.json`)) as Record<string, unknown>;
    const card = (d.card || d) as Record<string, unknown>;
    const match = String(card.sha256 || "") === sha;
    return {
      state: match ? "VALID" : "INVALID",
      sha256: sha,
      source: `${origin}/cards/${sha.slice(0, 16)}.json`,
      surface: card.surface ?? null,
      unmeasured: card.unmeasured ?? [],
      sig_ed25519: card.sig_ed25519 ?? null,
      not_a_certification: true,
      not_gspc: true,
    };
  } catch (e) {
    if (isHttp404(e)) {
      return {
        state: "INVALID",
        sha256: sha,
        reason: "not a leaf of the live root",
        source: `${origin}/cards/${sha.slice(0, 16)}.json`,
        not_a_certification: true,
        not_gspc: true,
      };
    }
    return { ...unreachablePayload(origin, `/cards/${sha.slice(0, 16)}.json`, e), state: "UNCHECKABLE", sha256: sha };
  }
}

export async function verifyInclusionTool(origin: string, args: Record<string, unknown>) {
  const sha = String(args.sha256 || "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    return { state: "UNCHECKABLE", reason: "sha256 must be 64 hex", not_a_certification: true };
  }
  try {
    const d = (await fetchOriginJson(origin, `/api/proof?sha=${sha}`)) as Record<string, unknown>;
    if (d.kind === "inclusion") return { state: "VALID", sha256: sha, merkle_root: d.merkle_root ?? null, not_a_certification: true };
    if (d.error === "not_found") return { state: "INVALID", sha256: sha, reason: d.reason ?? "not a leaf", not_a_certification: true };
    return { state: "UNCHECKABLE", sha256: sha, reason: d.reason ?? "unexpected proof body", not_a_certification: true };
  } catch (e) {
    if (isHttp404(e)) {
      return { state: "INVALID", sha256: sha, reason: "not a leaf", not_a_certification: true };
    }
    return { ...unreachablePayload(origin, `/api/proof?sha=${sha}`, e), state: "UNCHECKABLE", sha256: sha };
  }
}
