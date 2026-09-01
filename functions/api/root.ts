/**
 * GET /api/root — alias of public/root.json.
 * Same bytes the static door serves. Never a second forest.
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

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const r = await fetch(new URL("/root.json", origin).toString());
  if (!r.ok) {
    return json(
      {
        error: "not_found",
        path: "/api/root",
        unmeasured: ["root.json"],
        reason: `static /root.json HTTP ${r.status}`,
      },
      404,
    );
  }
  const text = await r.text();
  return new Response(text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
