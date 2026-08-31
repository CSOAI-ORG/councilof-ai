/**
 * Shared MCP tool handlers for Pages /mcp.
 * Definitions stay in ./gspc-tools.json (byte-for-byte with npm csoai-gspc-mcp).
 * Do not edit mcp/gspc-server — four-tool npm package stays honest.
 */
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
  const wanted = String(args.axis ?? "").trim().toLowerCase();
  if (!wanted) return { state: "BAD_INPUT", error: "pass an axis name, e.g. governance" };
  let d: Record<string, unknown>;
  try {
    d = (await fetchOriginJson(origin, "/api/gspc")) as Record<string, unknown>;
  } catch (e) {
    return unreachablePayload(origin, "/api/gspc", e);
  }
  const rows = (d.axes ?? []) as Record<string, unknown>[];
  const row = rows.find((r) => String(r.axis ?? "").toLowerCase() === wanted);
  if (!row) {
    return {
      state: "NOT_ON_BOARD",
      axis: wanted,
      note: "This name is not a row on the live board. That is a fact about the board, not a verdict about the subject.",
      board_carries: rows.map((r) => r.axis),
      as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    };
  }
  const measured = String(row.status ?? "").toUpperCase() === "MEASURED";
  return {
    state: "LIVE",
    axis: row.axis,
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
    const wanted = args.axis ? String(args.axis).toLowerCase() : null;
    const limit = Number.isInteger(args.limit) ? (args.limit as number) : 10;
    out.rows = rows
      .filter((r) => !wanted || String(r.axis ?? "").toLowerCase() === wanted)
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
