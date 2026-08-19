// Cloudflare Pages Function — /api/sov-arena/rounds.jsonl
// GET — live SOV arena evidence (AI-vs-AI / human-vs-AI / team rounds).
//
// Source: sov_arena.py on oracle-micro-2 appends every round to
// /evac-bulk/sov-mac-evac/sov_arena_rounds.jsonl; a Mac-side sync cron tail
// (sync-sov-arena-kv.sh) pushes the latest window into the SOV_ARENA_STATE KV
// namespace. This function serves it.
//
// Honesty discipline: 503 + plain statement when empty/unbound — a design-lab
// serves "no live state", never a fabricated round. Records carry DESIGN work.

export async function onRequestGet({ env }) {
  if (!env.SOV_ARENA_STATE) {
    return new Response(
      JSON.stringify({
        error: 'no live rounds',
        detail: 'KV binding SOV_ARENA_STATE is not visible to this function (deployment config)',
        label: 'DESIGN',
      }),
      { status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
    );
  }
  const body = await env.SOV_ARENA_STATE.get('rounds.jsonl');
  if (!body) {
    return new Response(
      JSON.stringify({
        error: 'no live rounds',
        detail: 'KV bound but key rounds.jsonl is empty — the fleet arena has not synced yet',
        label: 'DESIGN',
      }),
      { status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
    );
  }
  return new Response(body, {
    headers: {
      'content-type': 'application/x-ndjson',
      'cache-control': 'public, max-age=30',
      'x-sov-arena-source': 'oracle-micro-2 sov_arena.py, DESIGN LAB',
    },
  });
}