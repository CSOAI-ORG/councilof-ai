/**
 * GET /api/reported — third-party figures we carry but did not measure.
 *
 * REPORTED is claims made by a source about itself or another system: unsigned, not
 * measured here, and never entering the board. It is NOT the corrections ledger — that is
 * /api/corrections, a different shape about a different thing (what we got wrong and how it
 * was caught).
 *
 * This endpoint used to return a bare descriptor with NO `entries` key at all, while its own
 * note claimed "Live data fetched from /api/corrections. Returns the public surface." It
 * fetched nothing and returned nothing, and it named the wrong source: a corrections row is
 * {id, date, what_was_wrong, how_caught, fix, status}, which is not a REPORTED row and could
 * never populate one.
 *
 * That broken contract took the site down on 2026-09-04. /insurers reads this endpoint,
 * correctly refused a payload with no entries array, and rendered its honest error — whose
 * wording contains "fetch failed", which is one of the three strings the prerender guard
 * refuses to bake into a crawler-visible page. So the deploy failed, and it stayed failed
 * across eight merged PRs while the cause was assumed to be a transient 503 twice over.
 *
 * There is no REPORTED dataset in this repository — no file, no other producer, nothing
 * carrying {claim, source, source_url, captured_at}. So the honest answer is an EMPTY set,
 * which the page already renders as "An empty REPORTED set is the honest answer, not a
 * missing section." An empty array is a kept promise; a missing key is a broken one.
 */
// @openapi-post-not-implemented

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
  const asOf = new Date().toISOString();
  return json({
    schema: "csoai.reported/0.1",
    as_of: asOf,
    slug: "reported",
    description: "Third-party figures carried but not measured here",
    entries: [],
    count: 0,
    unmeasured: true,
    note:
      "No third-party reported figures are currently carried. The empty array is the answer, " +
      "not a placeholder: nothing in this repository publishes a REPORTED row, so returning " +
      "one would mean inventing it. REPORTED entries are unsigned, reported by their source, " +
      "and never enter the board. For what we got wrong and how it was caught, see " +
      "/api/corrections — a different ledger with a different shape.",
    not_a_certification: true,
  });
};

export const onRequestPost: PagesFunction = async () => {
  return json({
    schema: "csoai.reported.post/0.2",
    as_of: new Date().toISOString(),
    slug: "reported",
    state: "NOT_IMPLEMENTED",
    accepted: false,
    persisted: false,
    signed: false,
    note: "No submission store or triage queue exists. Nothing was accepted or published.",
  }, 501);
};
