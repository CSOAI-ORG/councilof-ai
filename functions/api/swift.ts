/**
 * GET /api/swift — reader of public/interop/swift-census.json.
 * Three-state census tape (LIVE / COMMITTED / DISCOVERED). DISCOVERED-first,
 * not MEASURED. Not a SWIFT client feed. writes_board=false.
 * Supersedes the swift-17 tape; 26 named banks sourced, 40+ universe cited.
 */
import tape from "../../public/interop/swift-census.json";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

type Row = {
  id: string;
  name: string;
  status: string;
  artifact_url: string | null;
  source?: string[];
};

/**
 * Recount the tape rather than read its header, and give each row its own n.
 *
 * Every count this endpoint served came off the tape's header, and `n_measured` was the
 * literal `0`. A typed zero cannot rise: if a row ever reached MEASURED the endpoint
 * would still have said none had. And a header nobody recounts is the same trust the
 * `header_agrees` blocks on /api/state exist to withdraw.
 *
 * A row's n is the number of PUBLIC SOURCES that name it and resolve in the tape's own
 * `sources` map. A source key with no entry is UNCHECKABLE and is not counted — absent
 * evidence is never counted as evidence. n stays far below 30 on every row, so every row
 * is UNMEASURED, which is first-class and is what the card should say.
 */
export function deriveSwiftCounts(rows: Row[], sources: Record<string, unknown>) {
  const byStatus: Record<string, number> = {};
  const perRow = rows.map((r) => {
    const keys = Array.isArray(r.source) ? r.source : [];
    const resolved = keys.filter((k, i) => k in sources && keys.indexOf(k) === i);
    const unresolved = keys.filter((k) => !(k in sources));
    const st = String(r.status || "UNCHECKABLE").toUpperCase();
    byStatus[st] = (byStatus[st] ?? 0) + 1;
    return {
      id: r.id,
      status: st,
      n: resolved.length,
      n_unit: "distinct public sources naming this bank, resolved in sources{}",
      sources_unresolvable: unresolved.length,
      quotable: resolved.length >= 30,
      unmeasured:
        resolved.length >= 30
          ? []
          : [`n=${resolved.length} below the quotable threshold of 30`],
    };
  });
  // TWO DIFFERENT AXES, and conflating them would read "LIVE 3" as "3 measured".
  // The tape's LIVE / COMMITTED / DISCOVERED is PRESS EVIDENCE: a dated, reachable press
  // URL saying a bank went live, committed, or was named. The tape says so itself --
  // "Not MEASURED — no ISO 20022 / copybook / MT artifact fetched."
  //
  // The MEASUREMENT ladder is DISCOVERED -> STAGED -> MEASURED, and what moves a row up
  // it is an artifact: something fetched from the bank's own rails. That is artifact_url,
  // and it is null on every row. So no row can be above DISCOVERED on the measurement
  // axis, whatever its press status says, and this counts the gate rather than asserting
  // the conclusion.
  const withArtifact = rows.filter((r) => typeof r.artifact_url === "string" && r.artifact_url).length;
  return {
    producer: "functions/api/swift.ts → deriveSwiftCounts(rows[], sources{})",
    press_axis: {
      what: "dated, reachable press URLs. LIVE/COMMITTED/DISCOVERED. Not a measurement.",
      counts: byStatus,
    },
    measurement_ladder: {
      order: ["DISCOVERED", "STAGED", "MEASURED"],
      gate: "artifact_url — an ISO 20022 / copybook / MT artifact fetched from the bank's own rails",
      rows_with_an_artifact: withArtifact,
      rows_without: rows.length - withArtifact,
      highest_reachable_today: withArtifact ? "STAGED" : "DISCOVERED",
      note:
        "No row carries an artifact_url, so no row is above DISCOVERED on the measurement " +
        "axis regardless of its press status. A bank being LIVE in the press is not a " +
        "measurement of that bank, and n_measured counts the second, never the first.",
    },
    n: rows.length,
    n_measured: byStatus.MEASURED ?? 0,
    n_live: byStatus.LIVE ?? 0,
    n_committed: byStatus.COMMITTED ?? 0,
    n_discovered: byStatus.DISCOVERED ?? 0,
    by_status: byStatus,
    per_row: perRow,
    rows_with_no_resolvable_source: perRow.filter((r) => r.n === 0).length,
  };
}

export const onRequestGet: PagesFunction = async () => {
  const t = tape as {
    sources: Record<string, unknown>;
    schema: string;
    n: number;
    n_live: number;
    n_committed: number;
    n_discovered: number;
    status_all: string;
    as_of: string;
    universe_note: string;
    honest_count_statement: string;
    supersedes: string;
    rows: Row[];
  };
  const d = deriveSwiftCounts(t.rows, (t.sources ?? {}) as Record<string, unknown>);
  return json({
    schema: t.schema,
    kind: "reader",
    writes_board: false,
    supersedes: t.supersedes,
    // Derived from rows[], never read off the header and never typed.
    n: d.n,
    n_measured: d.n_measured,
    n_live: d.n_live,
    n_committed: d.n_committed,
    n_discovered: d.n_discovered,
    per_card_n: d.per_row,
    counts_producer: d.producer,
    header_agrees: {
      producer: "functions/api/swift.ts → tape header vs rows[] recounted here",
      header: { n: t.n, n_live: t.n_live, n_committed: t.n_committed, n_discovered: t.n_discovered },
      agrees:
        t.n === d.n &&
        t.n_live === d.n_live &&
        t.n_committed === d.n_committed &&
        t.n_discovered === d.n_discovered,
      note: "If agrees is false the tape is internally inconsistent and neither set is quotable.",
    },
    recomputability:
      "Each row's n is the count of public sources in sources{} that name it. Fetch this " +
      "endpoint, resolve each row's source keys against sources{}, and you get the same n. " +
      "n_measured is counted from rows[].status, so it rises when a row does — it is not a " +
      "typed zero.",
    status_all: t.status_all,
    as_of: t.as_of,
    universe_note: t.universe_note,
    honesty: t.honest_count_statement,
    sources: t.sources,
    cobolbridge_ai: { http: 522, state: "IN_BUILD", note: "In build. Apex 522 is infra, not this tape. Do not demo." },
    rows: t.rows,
  });
};
