/**
 * GET/POST /api/webhooks — webhook CRUD (in-memory + KV if bound).
 * GET: returns array of { id, url, events, active, created_at }
 * POST: creates new webhook with { url, events }
 * DELETE: ?id=X removes a webhook
 *
 * Honest about state: in-memory means webhook subscriptions vanish on cold start.
 * Wire LEADS KV (or a future WEBHOOKS KV) to make them durable.
 */
interface Env { WEBHOOKS?: KVNamespace }

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

// Module-level in-memory store. Sufficient for the demo; replace with KV for prod.
const store: Map<string, Webhook> = new Map();

export const onRequestGet: PagesFunction<Env> = async () => {
  return Response.json(Array.from(store.values()));
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try { body = await ctx.request.json(); }
  catch { return Response.json({ error: "body must be JSON" }, { status: 400 }); }

  const url = String(body.url ?? "").slice(0, 500);
  const events = Array.isArray(body.events) ? body.events.filter((e) => typeof e === "string").slice(0, 20) : [];

  if (!/^https:\/\//.test(url)) {
    return Response.json({ error: "url must be https://" }, { status: 400 });
  }

  const id = "wh_" + crypto.randomUUID().slice(0, 8);
  const hook: Webhook = {
    id, url, events,
    active: true,
    created_at: new Date().toISOString(),
  };

  store.set(id, hook);

  if (ctx.env.WEBHOOKS) {
    await ctx.env.WEBHOOKS.put(id, JSON.stringify(hook));
  }

  return Response.json(hook, { status: 201 });
};

export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  store.delete(id);
  if (ctx.env.WEBHOOKS) await ctx.env.WEBHOOKS.delete(id);
  return Response.json({ deleted: id });
};
