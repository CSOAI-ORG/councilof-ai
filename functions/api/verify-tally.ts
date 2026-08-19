// /api/verify-tally — the opt-in public count of completed verifications.
//
// PRIVACY CONTRACT: the verify surfaces promise that nothing a user checks is
// sent, logged, or stored. This endpoint therefore receives ONLY an explicit
// opt-in click carrying a single bit (ok: true|false) and stores ONLY two
// counters. No record content, no identifiers, no IP retention.
// GRAMMAR: the tally is a SELF-REPORTED, OPT-IN signal — it is not a MEASURED
// number and every surface that shows it must say so.

interface Env { SOV_ARENA_STATE: KVNamespace }

const KEY = "verify_tally_v1";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const raw = (await env.SOV_ARENA_STATE.get(KEY)) || '{"ok":0,"fail":0}';
  return new Response(raw, {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
      "x-grammar": "self-reported opt-in signal; not a MEASURED number",
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let ok: boolean | null = null;
  try { ok = Boolean((await request.json() as any).ok); } catch { /* fallthrough */ }
  if (ok === null) return new Response('{"error":"body must be {\\"ok\\": true|false}"}', { status: 400 });
  const t = JSON.parse((await env.SOV_ARENA_STATE.get(KEY)) || '{"ok":0,"fail":0}');
  ok ? t.ok++ : t.fail++;
  await env.SOV_ARENA_STATE.put(KEY, JSON.stringify(t));
  return new Response(JSON.stringify({ counted: true, ...t }), {
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
};
