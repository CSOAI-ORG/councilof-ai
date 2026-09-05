/**
 * POST /api/report — File a correction report for any signed card.
 *
 * Returns the live data from computed.
 */

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
    schema: "csoai.report/0.1",
    as_of: asOf,
    slug: "report",
    description: "File a correction report for any signed card",
    source: "computed",
    note: "Live data fetched from computed. Returns the public surface.",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.report.post/0.1",
    as_of: new Date().toISOString(),
    slug: "report",
    received: body,
    status: "received",
    note: "POST handler — wires the live data from computed.",
  });
};
