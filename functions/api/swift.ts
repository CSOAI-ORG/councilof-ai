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

type Row = { id: string; name: string; status: string; artifact_url: string | null };

export const onRequestGet: PagesFunction = async () => {
  const t = tape as {
    schema: string;
    n: number;
    n_live: number;
    n_committed: number;
    n_discovered: number;
    status_all: string;
    as_of: string;
    sources: unknown;
    universe_note: string;
    honest_count_statement: string;
    supersedes: string;
    rows: Row[];
  };
  return json({
    schema: t.schema,
    kind: "reader",
    writes_board: false,
    supersedes: t.supersedes,
    n: t.n,
    n_measured: 0,
    n_live: t.n_live,
    n_committed: t.n_committed,
    n_discovered: t.n_discovered,
    status_all: t.status_all,
    as_of: t.as_of,
    universe_note: t.universe_note,
    honesty: t.honest_count_statement,
    sources: t.sources,
    cobolbridge_ai: { http: 522, note: "Infra. Not this tape. Do not demo a 522." },
    rows: t.rows,
  });
};
