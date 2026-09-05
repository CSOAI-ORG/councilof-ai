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
// that upgrades it is worse than no index. The population has since grown;
// status is therefore always read from each current immutable index row.

/// <reference types="@cloudflare/workers-types" />

const DATASET_API = "https://huggingface.co/api/datasets/csoai/gspc-hub-cards";
const HUB_ROOT = "https://huggingface.co/datasets/csoai/gspc-hub-cards/resolve";
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
  alg: string | null;
  did: string | null;
  verdict: string | null;
  indexed: string | null;
  created: string | null;
  name_published: boolean | null;
  unmeasured: string[];
  index: string;
}

interface IndexOutcome {
  index: string;
  state: "READ" | "READ_EMPTY" | "READ_WITH_MALFORMED_ROWS" | "HTTP_ERROR" | "FETCH_ERROR";
  http_status: number | null;
  rows: number;
  malformed_rows: number;
  cells: Cell[];
}

interface DatasetRevision {
  sha: string;
  last_modified: string | null;
}

async function resolveDatasetRevision(): Promise<DatasetRevision> {
  const response = await fetch(DATASET_API, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: TTL, cacheEverything: true },
  } as RequestInit);
  if (!response.ok)
    throw new Error(`dataset revision lookup answered HTTP ${response.status}`);
  const value = (await response.json()) as Record<string, unknown>;
  const sha = typeof value.sha === "string" ? value.sha : "";
  if (!/^[a-f0-9]{40,64}$/.test(sha))
    throw new Error("dataset revision lookup returned no immutable SHA");
  return {
    sha,
    last_modified:
      typeof value.lastModified === "string" ? value.lastModified : null,
  };
}

async function readIndex(name: string, revision: string): Promise<IndexOutcome> {
  try {
    const r = await fetch(`${HUB_ROOT}/${revision}/mill-cards/${name}.jsonl`, {
      headers: { Accept: "application/jsonl, text/plain" },
      cf: { cacheTtl: TTL, cacheEverything: true },
    } as RequestInit);
    if (!r.ok)
      return {
        index: `${name}.jsonl`,
        state: "HTTP_ERROR",
        http_status: r.status,
        rows: 0,
        malformed_rows: 0,
        cells: [],
      };
    const text = await r.text();
    const out: Cell[] = [];
    let malformed = 0;
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        const o = JSON.parse(t) as Record<string, unknown>;
        if (
          !o ||
          typeof o.model !== "string" ||
          !o.model.trim() ||
          typeof o.axis !== "string" ||
          !o.axis.trim() ||
          typeof o.status !== "string" ||
          !o.status.trim()
        ) {
          // Missing source state is withheld, never synthesized as UNCHECKABLE.
          malformed++;
          continue;
        }
        out.push({
          model: o.model,
          axis: o.axis,
          // Passed through verbatim — never derived and never defaulted.
          status: o.status,
          accuracy: typeof o.accuracy === "number" ? o.accuracy : null,
          n: typeof o.n === "number" ? o.n : null,
          card_sha256: o.card_sha256 ? String(o.card_sha256) : null,
          card_url: o.card_url ? String(o.card_url) : null,
          signed: o.signed === true,
          alg: typeof o.alg === "string" ? o.alg : null,
          did: typeof o.did === "string" ? o.did : null,
          // These are source fields, not verdicts recomputed by this mirror.
          verdict: typeof o.verdict === "string" ? o.verdict : null,
          indexed: typeof o.indexed === "string" ? o.indexed : null,
          created: typeof o.created === "string" ? o.created : null,
          name_published:
            typeof o.name_published === "boolean" ? o.name_published : null,
          unmeasured: Array.isArray(o.unmeasured) ? (o.unmeasured as string[]) : [],
          index: `${name}.jsonl`,
        });
      } catch {
        malformed++;
      }
    }
    return {
      index: `${name}.jsonl`,
      state:
        malformed > 0
          ? "READ_WITH_MALFORMED_ROWS"
          : out.length > 0
            ? "READ"
            : "READ_EMPTY",
      http_status: r.status,
      rows: out.length,
      malformed_rows: malformed,
      cells: out,
    };
  } catch {
    return {
      index: `${name}.jsonl`,
      state: "FETCH_ERROR",
      http_status: null,
      rows: 0,
      malformed_rows: 0,
      cells: [],
    };
  }
}

export const onRequestGet: PagesFunction = async () => {
  let revision: DatasetRevision;
  try {
    revision = await resolveDatasetRevision();
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          schema: "csoai.hub-cards/0.1",
          as_of: new Date().toISOString(),
          source: "huggingface.co/datasets/csoai/gspc-hub-cards",
          source_revision: null,
          error: error instanceof Error ? error.message : "dataset revision lookup failed",
          counts: {
            measured: 0,
            unmeasured: 0,
            other: 0,
            cells: 0,
            indexes_read: 0,
            indexes_total: INDEXES.length,
            malformed_rows: 0,
          },
          indexes: INDEXES.map((name) => ({
            index: `${name}.jsonl`,
            state: "NOT_READ_REVISION_UNAVAILABLE",
            http_status: null,
            rows: 0,
            malformed_rows: 0,
          })),
          cells: [],
        },
        null,
        1,
      ),
      {
        status: 503,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        },
      },
    );
  }

  const outcomes = await Promise.all(
    INDEXES.map((name) => readIndex(name, revision.sha)),
  );
  const cells = outcomes.flatMap((outcome) => outcome.cells);
  const reached = outcomes.filter((outcome) =>
    outcome.state.startsWith("READ"),
  ).length;
  const malformedRows = outcomes.reduce(
    (sum, outcome) => sum + outcome.malformed_rows,
    0,
  );

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
    source_revision: revision.sha,
    source_last_modified: revision.last_modified,
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
    counts: {
      ...counts,
      cells: cells.length,
      indexes_read: reached,
      indexes_total: INDEXES.length,
      malformed_rows: malformedRows,
    },
    indexes: outcomes.map(({ cells: _cells, ...outcome }) => outcome),
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
