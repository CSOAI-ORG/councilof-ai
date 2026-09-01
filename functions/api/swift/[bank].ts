/**
 * GET /api/swift/:bank — one three-state census row, or UNCHECKABLE if the id is unknown.
 * LIVE / COMMITTED / DISCOVERED. Never MEASURED, never a client.
 */
// Three ups, not four: wrangler compiles the repo-root functions/ dir, so this
// file sits at functions/api/swift/ and the tape at <root>/public/interop/.
// The extra ../ resolved outside the repo and failed every GHA deploy since
// #1009 ("Could not resolve" in run 33472240842) — the whole estate stopped
// shipping on it.
import tape from "../../../public/interop/swift-census.json";

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
  event_date?: string;
  source: string[];
  note: string;
  artifact_url: string | null;
};

const HONEST: Record<string, string> = {
  LIVE: "LIVE press-sourced tokenised-deposit transaction. Settlement still off-chain. Not a grade. Not a client.",
  COMMITTED: "COMMITTED: named in Swift's shared-ledger construction phase. Not in the pilot. Not MEASURED. Not a client.",
  DISCOVERED: "DISCOVERED. Named in the pilot cohort. No public ISO 20022 / copybook / MT artifact located. Not MEASURED. Not a client.",
};

export const onRequestGet: PagesFunction = async (context) => {
  const raw = context.params.bank;
  const id = String(Array.isArray(raw) ? raw[0] : raw || "").toLowerCase();
  const t = tape as { schema: string; sources: Record<string, unknown>; rows: Row[] };
  const row = t.rows.find((r) => r.id === id);
  if (!row) {
    return json(
      {
        schema: t.schema,
        kind: "reader",
        writes_board: false,
        status: "UNCHECKABLE",
        id,
        honesty: "Unknown bank id. Not a measurement. Not a client.",
      },
      404,
    );
  }
  return json({
    schema: t.schema,
    kind: "reader",
    writes_board: false,
    ...row,
    sources: row.source.map((s) => (t.sources as Record<string, unknown>)[s]).filter(Boolean),
    honesty: HONEST[row.status] ?? "Three-state census row. Not MEASURED. Not a client.",
  });
};
