/**
 * GET /api/swift/:bank — one DISCOVERED row, or UNCHECKABLE if the id is unknown.
 */
// Three ups, not four: wrangler compiles the repo-root functions/ dir, so this
// file sits at functions/api/swift/ and the tape at <root>/public/interop/.
// The extra ../ resolved outside the repo and failed every GHA deploy since
// #1009 ("Could not resolve" in run 33472240842) — the whole estate stopped
// shipping on it.
import tape from "../../../public/interop/swift-17.json";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async (context) => {
  const raw = context.params.bank;
  const id = String(Array.isArray(raw) ? raw[0] : raw || "").toLowerCase();
  const rows = (tape as { rows: Array<{ id: string; name: string; status: string; artifact_url: string | null }> }).rows;
  const row = rows.find((r) => r.id === id);
  if (!row) {
    return json(
      {
        schema: "csoai.swift-17/0.1",
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
    schema: "csoai.swift-17/0.1",
    kind: "reader",
    writes_board: false,
    ...row,
    artifact: row.artifact_url ? "FETCH" : "none",
    honesty: row.artifact_url
      ? "Public artifact URL present. Grade only after FETCH."
      : "DISCOVERED. No public ISO 20022 / copybook / MT file located. Not MEASURED.",
  });
};
