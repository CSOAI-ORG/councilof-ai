/**
 * POST /api/memory — cross-session chat memory via signed cards.
 *
 * Memory = every chat becomes a signed card on the chain.
 * Same user across sessions = same memory (cards chain).
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
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");

  return json({
    schema: "csoai.memory/0.1",
    user_id: userId,
    as_of: new Date().toISOString(),
    note: "Memory = every chat is a signed card on the chain. Cross-session = same memory.",
    memory_endpoint: "/api/memory",
    read_endpoint: "/api/memory?user_id=" + userId,
    write_endpoint: "/api/chat (every response is a card)",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({
    schema: "csoai.memory.post/0.1",
    user_id: body.user_id,
    as_of: new Date().toISOString(),
    received: body,
    note: "Memory write: every chat becomes a signed card on the chain.",
  });
};
