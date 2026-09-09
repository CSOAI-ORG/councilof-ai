// /api/hub-cards — same-origin mirror of the third-party (model, axis) cells.
//
// WHY THIS EXISTS. Everything measured on /api/findings is OUR OWN fleet:
// 64 models, all clan-csoai-* / clan-law-* / clan-meok-* / clan-defoneos-*.
// Zero third-party models. The HuggingFace models we have carded live in
// huggingface.co/datasets/csoai/gspc-hub-cards, and a browser cannot read them:
// HF answers `access-control-allow-origin: https://huggingface.co`, so a fetch
// from councilof.ai is blocked. Without a server-side mirror the dashboard can
// only ever show us grading ourselves, which is the weakest thing a measurement
// body can display.
//
// This reads the published index rows and serves them same-origin. It reads
// only; it never writes to the Hub and holds no key.
//
// It does NOT upgrade anything. Each row's status is passed through exactly as
// published. On 2026-09-03 all 82 of those rows read UNMEASURED with
// unmeasured: ["signed-pending-verify"] — a valid signature over a body that
// says UNMEASURED means the cell is unmeasured, and an index (or an endpoint)
// that upgrades it is worse than no index, because the signature is what
// invites the trust. See issue #1155.
//
// AND IT DOES NOT TOTAL A PARTIAL READ. On 2026-09-05 this endpoint served
// `{measured: 647, unmeasured: 35, cells: 682}` while INDEX-safety and
// INDEX-art5-affect were answering nothing. Both held ONLY UNMEASURED rows, so
// the real published population was 717 cells / 647 MEASURED / 70 UNMEASURED:
// the endpoint halved the unmeasured count, in the flattering direction. A
// subtotal published as a total is an invented number. When any index is unread
// the totals are now withheld (null) and what was read is offered separately,
// under a name that cannot be mistaken for the population.

/// <reference types="@cloudflare/workers-types" />

const HUB = "https://huggingface.co/datasets/csoai/gspc-hub-cards/resolve/main/mill-cards";
// The four this endpoint has always read. From 2026-09-05 they are a FALLBACK, not
// the population: `indexes_total: 4` was a literal, and reporting `complete: true`
// against a list the code chose is a completeness claim about our own source file
// rather than about the dataset. If a fifth index is ever published, the old code
// could not see it and would still have said "all published indexes were read".
const KNOWN_INDEXES = ["INDEX", "INDEX-safety", "INDEX-art5-affect", "INDEX-empty3"];
const TREE = "https://huggingface.co/api/datasets/csoai/gspc-hub-cards/tree/main/mill-cards";
const TTL = 600; // 10 min — the mill writes far less often than that

interface Cell {
  model: string;
  axis: string;
  status: string;
  accuracy: number | null;
  n: number | null;
  card_sha256: string | null;
  card_url: string | null;
  signed: boolean;
  unmeasured: string[];
  index: string;
}

/**
 * An index either answered or it did not. `ok: true` with zero cells is a real,
 * empty index — it has been read. Only `ok: false` is unread, and it always
 * carries the reason, because "we could not read it" and "it holds nothing" are
 * different facts and only one of them is ours to assert.
 */
type IndexRead =
  | { ok: true; name: string; cells: Cell[] }
  | { ok: false; name: string; reason: string };

type ParsedRows =
  | { ok: true; cells: Cell[] }
  | { ok: false; reason: string };

interface Supersession {
  superseded_id: string;
  by_id: string;
  model: string;
  axis: string;
}

type UnresolvedSupersession = Supersession & { reason: string };

type LedgerRead =
  | { ok: true; entries: Supersession[] }
  | { ok: false; reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOptionalString = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || typeof value === "string";

const isOptionalNumber = (value: unknown): value is number | null | undefined =>
  value === undefined ||
  value === null ||
  (typeof value === "number" && Number.isFinite(value));

function parseRows(text: string, name: string): ParsedRows {
  const out: Cell[] = [];
  for (const [offset, line] of text.split("\n").entries()) {
    const t = line.trim();
    if (!t) continue;
    let value: unknown;
    try {
      value = JSON.parse(t) as unknown;
    } catch {
      return { ok: false, reason: `invalid jsonl row ${offset + 1}: malformed JSON` };
    }

    if (!isRecord(value)) {
      return {
        ok: false,
        reason: `invalid jsonl row ${offset + 1}: row is not an object`,
      };
    }
    const o = value;
    if (typeof o.model !== "string" || !o.model.trim()) {
      return {
        ok: false,
        reason: `invalid jsonl row ${offset + 1}: model must be a non-empty string`,
      };
    }
    if (typeof o.axis !== "string" || !o.axis.trim()) {
      return { ok: false, reason: `invalid jsonl row ${offset + 1}: axis must be a non-empty string` };
    }
    if (typeof o.status !== "string" || !o.status.trim()) {
      return {
        ok: false,
        reason: `invalid jsonl row ${offset + 1}: status must be a non-empty string`,
      };
    }
    if (o.signed !== true) {
      return { ok: false, reason: `invalid jsonl row ${offset + 1}: signed must be boolean true` };
    }
    if (!isOptionalNumber(o.accuracy)) {
      return {
        ok: false,
        reason: `invalid jsonl row ${offset + 1}: accuracy must be a finite number or null`,
      };
    }
    if (!isOptionalNumber(o.n)) {
      return { ok: false, reason: `invalid jsonl row ${offset + 1}: n must be a finite number or null` };
    }
    if (!isOptionalString(o.card_sha256)) {
      return {
        ok: false,
        reason: `invalid jsonl row ${offset + 1}: card_sha256 must be a string or null`,
      };
    }
    if (!isOptionalString(o.card_url)) {
      return { ok: false, reason: `invalid jsonl row ${offset + 1}: card_url must be a string or null` };
    }
    if (
      o.unmeasured !== undefined &&
      (!Array.isArray(o.unmeasured) ||
        !o.unmeasured.every((item) => typeof item === "string"))
    ) {
      return {
        ok: false,
        reason: `invalid jsonl row ${offset + 1}: unmeasured must be an array of strings`,
      };
    }

    out.push({
      model: o.model,
      axis: o.axis,
      // passed through verbatim — never derived, never defaulted
      status: o.status,
      accuracy: o.accuracy ?? null,
      n: o.n ?? null,
      card_sha256: o.card_sha256 ?? null,
      card_url: o.card_url ?? null,
      signed: true,
      unmeasured: o.unmeasured ?? [],
      index: `${name}.jsonl`,
    });
  }
  return { ok: true, cells: out };
}

/**
 * `cached` is the first attempt. It carries `cacheEverything`, which caches
 * whatever HF returned — including a 429 — for the whole TTL, so a single
 * throttled response keeps an index dark for ten minutes. The retry deliberately
 * omits the cf directive so it cannot be served that cached failure.
 */
async function attempt(name: string, cached: boolean): Promise<IndexRead> {
  const init: RequestInit = { headers: { Accept: "application/jsonl, text/plain" } };
  if (cached) {
    (init as RequestInit & { cf?: unknown }).cf = { cacheTtl: TTL, cacheEverything: true };
  }
  try {
    const r = await fetch(`${HUB}/${name}.jsonl`, init);
    if (!r.ok) return { ok: false, name, reason: `http ${r.status}` };
    const parsed = parseRows(await r.text(), name);
    return parsed.ok
      ? { ok: true, name, cells: parsed.cells }
      : { ok: false, name, reason: parsed.reason };
  } catch (e) {
    return { ok: false, name, reason: `fetch failed: ${(e as Error)?.message ?? "unknown"}` };
  }
}

async function readIndex(name: string): Promise<IndexRead> {
  const first = await attempt(name, true);
  if (first.ok) return first;
  return attempt(name, false);
}

/**
 * The index files the dataset actually holds, so the population is what is
 * published rather than what this file remembers. Returns null when the listing
 * cannot be read — the caller then falls back to KNOWN_INDEXES and SAYS SO,
 * because "these are the indexes" and "these are the indexes I know about" are
 * different claims and only one of them supports `complete: true`.
 */
async function discoverIndexes(): Promise<string[] | null> {
  try {
    const r = await fetch(TREE, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: TTL, cacheEverything: true },
    } as RequestInit);
    if (!r.ok) return null;
    const tree = (await r.json()) as Array<{ type?: string; path?: string }>;
    if (!Array.isArray(tree)) return null;
    const names = tree
      .filter((f) => f?.type === "file" && typeof f.path === "string")
      .map((f) => (f.path as string).split("/").pop() ?? "")
      .filter((n) => n.startsWith("INDEX") && n.endsWith(".jsonl"))
      .map((n) => n.slice(0, -".jsonl".length));
    // An empty listing is not "no indexes" — it is a listing that told us nothing
    // useful, and treating it as the population would publish cells: 0 as a fact.
    return names.length ? [...new Set(names)].sort() : null;
  } catch {
    return null;
  }
}

/**
 * Card ids the estate's own ledger says are NO LONGER the live card for their
 * (model, axis). `sign_mill_cards.py` writes a corrected body to a new
 * content-addressed path and records the replacement here; `flip_hub_queue.py`
 * already skips these when it rebuilds INDEX.jsonl.
 *
 * This endpoint did not, and only INDEX.jsonl is ever rebuilt. The three static
 * indexes were written once and still list the pre-correction cards, so on
 * 2026-09-05 all 70 cells reported UNMEASURED with ["signed-pending-verify"]
 * were cards the ledger had already superseded — every one of them had a
 * MEASURED replacement in INDEX.jsonl for the same (model, axis). The endpoint
 * was serving 826 cells for 753 distinct pairs and calling 70 of them
 * unmeasured when the live figure was zero. Reading the ledger is what makes
 * "status is passed through" true of the LIVE card rather than of any card that
 * was ever signed.
 */
function parseSupersessions(text: string): LedgerRead {
  const entries: Supersession[] = [];
  for (const [offset, line] of text.split("\n").entries()) {
    const t = line.trim();
    if (!t) continue;
    let value: unknown;
    try {
      value = JSON.parse(t) as unknown;
    } catch {
      return { ok: false, reason: `invalid jsonl row ${offset + 1}: malformed JSON` };
    }
    if (!isRecord(value)) {
      return {
        ok: false,
        reason: `invalid jsonl row ${offset + 1}: row is not an object`,
      };
    }
    for (const field of ["superseded_id", "by_id", "model", "axis"] as const) {
      if (typeof value[field] !== "string" || !value[field].trim()) {
        return {
          ok: false,
          reason: `invalid jsonl row ${offset + 1}: ${field} must be a non-empty string`,
        };
      }
    }
    if (value.superseded_id === value.by_id) {
      return {
        ok: false,
        reason: `invalid jsonl row ${offset + 1}: superseded_id and by_id must differ`,
      };
    }
    entries.push({
      superseded_id: value.superseded_id as string,
      by_id: value.by_id as string,
      model: value.model as string,
      axis: value.axis as string,
    });
  }
  return { ok: true, entries };
}

async function readSupersessions(origin: string): Promise<LedgerRead> {
  const url = `${origin}/interop/mill-cards-signed/SUPERSEDED.jsonl`;
  let reason = "unreadable";
  for (const cached of [true, false]) {
    const init: RequestInit = { headers: { Accept: "application/jsonl, text/plain" } };
    if (cached) {
      (init as RequestInit & { cf?: unknown }).cf = { cacheTtl: TTL, cacheEverything: true };
    }
    try {
      const r = await fetch(url, init);
      if (!r.ok) {
        reason = `http ${r.status}`;
        continue;
      }
      const parsed = parseSupersessions(await r.text());
      if (parsed.ok) return parsed;
      reason = parsed.reason;
    } catch (e) {
      reason = `fetch failed: ${(e as Error)?.message ?? "unknown"}`;
    }
  }
  // NOT an empty successful ledger. "I could not read the ledger" and "nothing
  // is superseded" are different facts; conflating them quietly overstates the
  // census.
  return { ok: false, reason };
}

export const onRequestGet: PagesFunction = async (ctx) => {
  // The site answers on more than one host, so the ledger is read from whichever
  // origin served this request. Falls back rather than throwing: a handler that
  // dies because it could not name its own host would turn a stale-row fix into
  // an outage.
  let origin = "https://councilof.ai";
  try {
    const u = (ctx as { request?: { url?: string } } | undefined)?.request?.url;
    if (u) origin = new URL(u).origin;
  } catch {
    /* keep the default */
  }
  const discovered = await discoverIndexes();
  const indexes = discovered ?? KNOWN_INDEXES;
  const [reads, ledger] = await Promise.all([
    Promise.all(indexes.map(readIndex)),
    readSupersessions(origin),
  ]);
  const rawCells = reads.flatMap((r) => (r.ok ? r.cells : []));

  // A ledger assertion is not enough to delete an observed row. The exact by_id
  // replacement must also be in the observed Hub indexes and name the same pair.
  // Otherwise the cross-host publication is incomplete and no total is quotable.
  const cellsById = new Map<string, Cell[]>();
  for (const cell of rawCells) {
    if (!cell.card_sha256) continue;
    const matches = cellsById.get(cell.card_sha256) ?? [];
    matches.push(cell);
    cellsById.set(cell.card_sha256, matches);
  }
  const excludableIds = new Set<string>();
  const unresolvedSupersessions: UnresolvedSupersession[] = [];
  if (ledger.ok) {
    for (const entry of ledger.entries) {
      const predecessors = cellsById.get(entry.superseded_id) ?? [];
      if (!predecessors.length) continue;
      const replacements = cellsById.get(entry.by_id) ?? [];
      const expectedPair = `${entry.model}\u0000${entry.axis}`;
      const predecessorMatches = predecessors.every(
        (cell) => `${cell.model}\u0000${cell.axis}` === expectedPair,
      );
      const replacementMatches =
        replacements.length > 0 &&
        replacements.every(
          (cell) => `${cell.model}\u0000${cell.axis}` === expectedPair,
        );
      if (!predecessorMatches) {
        unresolvedSupersessions.push({
          ...entry,
          reason: "predecessor pair does not match ledger",
        });
      } else if (!replacementMatches) {
        unresolvedSupersessions.push({
          ...entry,
          reason: replacements.length
            ? "replacement pair does not match predecessor"
            : "replacement is absent from observed indexes",
        });
      } else {
        excludableIds.add(entry.superseded_id);
      }
    }
  }
  const afterLedger = ledger.ok
    ? rawCells.filter((cell) => !(cell.card_sha256 && excludableIds.has(cell.card_sha256)))
    : rawCells;
  const supersededExcluded = ledger.ok ? rawCells.length - afterLedger.length : null;
  const byPair = new Map<string, Cell>();
  for (const c of afterLedger) {
    const key = `${c.model}\u0000${c.axis}`;
    if (!byPair.has(key)) byPair.set(key, c);
  }
  const cells = [...byPair.values()];
  const duplicatesCollapsed = afterLedger.length - cells.length;
  const unread = reads.filter((r): r is Extract<IndexRead, { ok: false }> => !r.ok);
  const reached = reads.length - unread.length;
  // A known-index subtotal is not a discovered population; an unread supersession
  // ledger cannot establish which rows are current. Keep rows available, but
  // withhold population totals until all three checks succeeded.
  const allIndexesRead = unread.length === 0;
  const supersessionsResolved = ledger.ok && unresolvedSupersessions.length === 0;
  const complete = discovered !== null && allIndexesRead && supersessionsResolved;

  const seen = { measured: 0, unmeasured: 0, other: 0, cells: cells.length };
  for (const c of cells) {
    const s = c.status.toUpperCase();
    if (s === "MEASURED") seen.measured++;
    else if (s === "UNMEASURED") seen.unmeasured++;
    else seen.other++;
  }

  const unreadList = unread.map((r) => ({ index: `${r.name}.jsonl`, reason: r.reason }));

  const body = {
    schema: "csoai.hub-cards/0.2",
    as_of: new Date().toISOString(),
    source: "huggingface.co/datasets/csoai/gspc-hub-cards",
    population: "third-party models on the Hub — NOT the CSOAI fleet",
    honesty: {
      status_is_passed_through:
        "Each row's status is exactly as published. This endpoint never upgrades a cell. A valid signature over a body that says UNMEASURED means the cell is UNMEASURED.",
      not_the_board:
        "These cells are not the 22-axis board. The board is GET /api/gspc; quote totals.public_count.",
      own_fleet_is_elsewhere:
        "GET /api/findings carries the CSOAI fleet, which is a different population and is measured against the same frozen banks.",
      unreachable_is_not_empty: allIndexesRead
        ? discovered ? "All discovered published indexes were read." : "All known fallback indexes were read; the full index list is UNCHECKABLE."
        : `Only ${reached} of ${indexes.length} indexes answered (unread: ${unreadList
            .map((u) => u.index)
            .join(", ")}). Missing rows are UNCHECKABLE, not absent.`,
      index_list_is: discovered
        ? `Discovered from the dataset: ${indexes.length} index file(s) published under mill-cards/.`
        : "UNCHECKABLE — the dataset listing did not answer, so this fell back to the four indexes this endpoint knows about. There may be others, so counts are not claimed complete.",
      one_cell_per_pair:
        "A (model, axis) appears once. A predecessor is dropped only when its exact by_id replacement is observed for the same pair; unresolved supersessions withhold totals. Remaining duplicates are collapsed keeping the row from the rebuilt INDEX.jsonl.",
      superseded_ledger: ledger.ok
        ? unresolvedSupersessions.length
          ? `Read, but ${unresolvedSupersessions.length} observed predecessor row(s) lacked an observed same-pair replacement. No unresolved predecessor was dropped and population totals are withheld.`
          : `Read. ${supersededExcluded} served row(s) referenced a card whose exact same-pair replacement was observed and were dropped.`
        : `UNREADABLE (${ledger.reason}). Staleness could not be checked, so no row was dropped and these counts are an UPPER BOUND on the live population, not the population.`,
      // LP07/08. Five numbers here describe the same population and nothing said how
      // they relate, so a reader met 1232, 376, 0, 856 and 856 with no way to check any
      // of them against the others. Stated once, with the live values, so the arithmetic
      // is visible rather than reconstructable.
      cell_arithmetic:
        `rows_served_by_indexes ${rawCells.length} − duplicates_collapsed ${duplicatesCollapsed}` +
        (ledger.ok ? ` − superseded_excluded ${supersededExcluded}` : " − superseded_excluded UNCHECKABLE") +
        ` = read_so_far.cells ${cells.length}. Of those retrieved cells, read_so_far.measured ${seen.measured} carry a signed body reading MEASURED. ` +
        (complete
          ? "All completeness gates passed, so the count fields expose these as population totals. "
          : "A completeness gate failed, so these retrieved-row figures are not population totals and the count fields are null. ") +
        "The terms are never added to each other, and none of them is a coverage score. " +
        "n_measured on /api/state → hub_census counts a DIFFERENT population (the 3M-listing " +
        "census walk) and is not this number.",
      partial_read_has_no_total: complete
        ? "Discovery, every index and the supersession ledger answered, and every observed predecessor had its exact same-pair replacement; counts therefore describe the observed published population."
        : "Discovery, an index, the supersession ledger, or an observed replacement could not be checked, so population totals are null. counts.read_so_far describes retrieved rows only: it may omit unread rows or include unresolved predecessors, and is neither a guaranteed floor nor a complete live population.",
    },
    counts: {
      complete,
      // Withheld on a partial read. Never estimated, never a subtotal in disguise.
      measured: complete ? seen.measured : null,
      unmeasured: complete ? seen.unmeasured : null,
      other: complete ? seen.other : null,
      cells: complete ? seen.cells : null,
      read_so_far: seen,
      // null means the ledger did not answer — NOT that nothing was superseded.
      superseded_excluded: supersededExcluded,
      duplicates_collapsed: duplicatesCollapsed,
      rows_served_by_indexes: rawCells.length,
      indexes_read: reached,
      indexes_total: indexes.length,
      indexes_discovered: discovered !== null,
      indexes_all_read: allIndexesRead,
      superseded_ledger_read: ledger.ok,
      supersessions_resolved: supersessionsResolved,
      supersessions_unresolved: unresolvedSupersessions,
      indexes_unread: unreadList,
    },
    cells,
  };

  return new Response(JSON.stringify(body, null, 1), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // A partial read must not be cached as if it were the population.
      "cache-control": complete ? `public, max-age=${TTL}` : "public, max-age=60",
      "access-control-allow-origin": "*",
    },
    status: reached === 0 ? 503 : 200,
  });
};
