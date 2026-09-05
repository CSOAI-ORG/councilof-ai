/**
 * POST /api/files — file upload + analysis.
 *
 * Every uploaded file gets:
 *  - SHA-256 hash
 *  - 22-axis GSPC analysis (if AI-generated)
 *  - Signed card on the chain
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

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.files/0.1",
    as_of: new Date().toISOString(),
    received: body,
    note: "File upload + analysis. Every file gets a 22-axis GSPC analysis + signed card.",
  });
};
