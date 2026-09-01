/**
 * GET /api/swift — reader of public/interop/swift-17.json.
 * Census tape. DISCOVERED, not MEASURED. Not a SWIFT client feed. writes_board=false.
 */
import tape from "../../public/interop/swift-17.json";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () => {
  const t = tape as {
    n: number;
    status_all: string;
    rows: Array<{ id: string; name: string; status: string; artifact_url: string | null }>;
    press: unknown;
    honesty: string;
    writes_board: boolean;
    as_of: string;
    schema: string;
  };
  return json({
    schema: t.schema,
    kind: "reader",
    writes_board: false,
    n: t.n,
    n_measured: 0,
    status_all: t.status_all,
    as_of: t.as_of,
    press: t.press,
    honesty: t.honesty,
    cobolbridge_ai: { http: 522, note: "Infra. Not this tape. Do not demo a 522." },
    rows: t.rows,
  });
};
