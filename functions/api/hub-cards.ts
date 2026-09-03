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

async function readIndex(name: string): Promise<Cell[]> {
  try {
    const r = await fetch(`${HUB}/${name}.jsonl`, {
      headers: { Accept: "application/jsonl, text/plain" },
      cf: { cacheTtl: TTL, cacheEverything: true },
    } as RequestInit);
    if (!r.ok) return [];
    const text = await r.text();
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
  } catch {
    return [];
  }
}

export const onRequestGet: PagesFunction = async () => {
  const batches = await Promise.all(INDEXES.map(readIndex));
  const cells = batches.flat();
  const reached = batches.filter((b) => b.length > 0).length;

  const counts = { measured: 0, unmeasured: 0, other: 0 };
  for (const c of cells) {
    const s = c.status.toUpperCase();
    if (s === "MEASURED") counts.measured++;
    else if (s === "UNMEASURED") counts.unmeasured++;
    else counts.other++;
  }

  const body = {
    schema: "csoai.hub-cards/0.1",
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
      unreachable_is_not_empty:
        reached === INDEXES.length
          ? "All published indexes were read."
          : `Only ${reached} of ${INDEXES.length} indexes answered. Missing rows are UNCHECKABLE, not absent.`,
    },
    counts: { ...counts, cells: cells.length, indexes_read: reached, indexes_total: INDEXES.length },
    cells,
  };

  return new Response(JSON.stringify(body, null, 1), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${TTL}`,
      "access-control-allow-origin": "*",
    },
    status: reached === 0 ? 503 : 200,
  });
};
