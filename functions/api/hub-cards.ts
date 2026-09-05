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
const INDEXES = ["INDEX", "INDEX-safety", "INDEX-art5-affect", "INDEX-empty3"];
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

function parseRows(text: string, name: string): Cell[] {
  const out: Cell[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const o = JSON.parse(t) as Record<string, unknown>;
      out.push({
        model: String(o.model ?? ""),
        axis: String(o.axis ?? ""),
        // passed through verbatim — never derived, never defaulted
        status: String(o.status ?? "UNCHECKABLE"),
        accuracy: typeof o.accuracy === "number" ? o.accuracy : null,
        n: typeof o.n === "number" ? o.n : null,
        card_sha256: o.card_sha256 ? String(o.card_sha256) : null,
        card_url: o.card_url ? String(o.card_url) : null,
        signed: Boolean(o.signed),
        unmeasured: Array.isArray(o.unmeasured) ? (o.unmeasured as string[]) : [],
        index: `${name}.jsonl`,
      });
    } catch {
      /* one bad line must not lose the file */
    }
  }
  return out;
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
    return { ok: true, name, cells: parseRows(await r.text(), name) };
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
async function readSupersededIds(origin: string): Promise<Set<string> | null> {
  const url = `${origin}/interop/mill-cards-signed/SUPERSEDED.jsonl`;
  for (const cached of [true, false]) {
    const init: RequestInit = { headers: { Accept: "application/jsonl, text/plain" } };
    if (cached) {
      (init as RequestInit & { cf?: unknown }).cf = { cacheTtl: TTL, cacheEverything: true };
    }
    try {
      const r = await fetch(url, init);
      if (!r.ok) continue;
      const ids = new Set<string>();
      for (const line of (await r.text()).split("\n")) {
        const t = line.trim();
        if (!t) continue;
        try {
          const o = JSON.parse(t) as Record<string, unknown>;
          if (o.superseded_id) ids.add(String(o.superseded_id));
        } catch {
          /* one bad ledger line must not lose the rest */
        }
      }
      return ids;
    } catch {
      /* fall through to the uncached attempt */
    }
  }
  // NOT an empty set. "I could not read the ledger" and "nothing is superseded"
  // are different facts, and returning the empty set would silently assert the
  // second one and quietly overstate the census.
  return null;
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
  const [reads, supersededIds] = await Promise.all([
    Promise.all(INDEXES.map(readIndex)),
    readSupersededIds(origin),
  ]);
  const rawCells = reads.flatMap((r) => (r.ok ? r.cells : []));

  // Drop cards the ledger has replaced, then collapse the remaining duplicates so
  // one (model, axis) is one cell. INDEXES order decides which row survives, and
  // INDEX.jsonl — the only one that is rebuilt — is first.
  const afterLedger = supersededIds
    ? rawCells.filter((c) => !(c.card_sha256 && supersededIds.has(c.card_sha256)))
    : rawCells;
  const supersededExcluded = supersededIds ? rawCells.length - afterLedger.length : null;
  const byPair = new Map<string, Cell>();
  for (const c of afterLedger) {
    const key = `${c.model}\u0000${c.axis}`;
    if (!byPair.has(key)) byPair.set(key, c);
  }
  const cells = [...byPair.values()];
  const duplicatesCollapsed = afterLedger.length - cells.length;
  const unread = reads.filter((r): r is Extract<IndexRead, { ok: false }> => !r.ok);
  const reached = reads.length - unread.length;
  const complete = unread.length === 0;

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
      unreachable_is_not_empty: complete
        ? "All published indexes were read."
        : `Only ${reached} of ${INDEXES.length} indexes answered (unread: ${unreadList
            .map((u) => u.index)
            .join(", ")}). Missing rows are UNCHECKABLE, not absent.`,
      one_cell_per_pair:
        "A (model, axis) appears once. Cards the SUPERSEDED.jsonl ledger has replaced are dropped, then duplicates are collapsed keeping the row from the rebuilt INDEX.jsonl. Before this the same pair could be counted twice with two different statuses.",
      superseded_ledger: supersededIds
        ? `Read. ${supersededExcluded} served row(s) referenced a card the ledger has replaced and were dropped; the replacement carries the live status.`
        : "UNREADABLE. Staleness could not be checked, so no row was dropped and these counts are an UPPER BOUND on the live population, not the population.",
      partial_read_has_no_total: complete
        ? "Every index answered, so counts are the whole published population."
        : "An index did not answer, so measured/unmeasured/cells are null. A subtotal is not a total, and the rows behind an unread index are disproportionately UNMEASURED — publishing the subtotal would understate what is unmeasured. Read counts.read_so_far instead, and treat it as a floor, never as the population.",
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
      indexes_total: INDEXES.length,
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
