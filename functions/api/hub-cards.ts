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

export const onRequestGet: PagesFunction = async () => {
  const reads = await Promise.all(INDEXES.map(readIndex));
  const cells = reads.flatMap((r) => (r.ok ? r.cells : []));
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
