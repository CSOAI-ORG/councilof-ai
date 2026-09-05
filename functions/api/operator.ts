/**
 * POST /api/operator — browser agent.
 *
 * Every action is signed + attested.
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
    schema: "csoai.operator/0.1",
    as_of: new Date().toISOString(),
    received: body,
    note: "Browser agent. Every action is signed + attested.",
  });
};
