/**
 * GET /api/owm — the outer world model snapshot: every observed subject (own surfaces included), its state
 * (CONSISTENT / INCONSISTENT / SINGLE_SURFACE / UNCHECKABLE / UNMEASURED), last change, evidence sha256 and
 * next check, plus each reaction-loop stage and whether it is LIVE, STAGED or MISSING.
 *
 * Read-only. It serves the committed public/owm/v0.1/latest.json bytes, parsed, after re-deriving every count
 * and stage status from the rows (functions/_lib/owm.ts); any mismatch is a 503, never a partial snapshot.
 * The snapshot is UNSIGNED (a new kind) and is only as fresh as the last land: `served.state` says CURRENT or
 * STALE against the snapshot's own stale_after_s, and `served.age_s` says how old it is.
 *
 *   ?subject=<id>   one subject row (404 if the snapshot has no such subject)
 */
import { type Ctx, OWM_PATH, sha256Hex, unavailable, validateSnapshot } from "../_lib/owm";

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const url = new URL(ctx.request.url);
  let bytes: ArrayBuffer;
  try {
    const assetUrl = new URL(OWM_PATH, url.origin).toString();
    const r = ctx.env.ASSETS ? await ctx.env.ASSETS.fetch(new Request(assetUrl)) : await fetch(assetUrl);
    if (!r.ok) return unavailable(`static ${OWM_PATH} HTTP ${r.status}`);
    bytes = await r.arrayBuffer();
  } catch (e) {
    return unavailable(`static ${OWM_PATH} unreadable: ${(e as Error).message}`);
  }
  const raw = new TextDecoder().decode(bytes);
  const { snapshot, checks } = validateSnapshot(raw);
  const failed = checks.filter((c) => !c.ok);
  if (!snapshot || failed.length) {
    return unavailable(failed.map((c) => `${c.check}: ${c.detail}`).join("; ") || "unparseable", checks);
  }
  const bytesSha = await sha256Hex(bytes);
  const ageS = Math.max(0, Math.floor((Date.now() - Date.parse(snapshot.generated_at as string)) / 1000));
  const served = {
    state: ageS > (snapshot.stale_after_s as number) ? "STALE" : "CURRENT",
    age_s: ageS,
    stale_after_s: snapshot.stale_after_s,
    bytes_sha256: bytesSha,
    raw: OWM_PATH,
    checks: checks.map((c) => c.check),
    note: "The snapshot committed with the last land, re-validated on this request; not a live read of the world. Unsigned: a new kind.",
  };
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=60",
    "access-control-allow-origin": "*",
    "x-owm-bytes-sha256": bytesSha,
  };
  const subjectId = url.searchParams.get("subject");
  if (subjectId !== null) {
    const row = (snapshot.subjects ?? []).find((s) => s.id === subjectId);
    if (!row) {
      return new Response(JSON.stringify({ error: "not_found", subject: subjectId, known: (snapshot.subjects ?? []).map((s) => s.id) }, null, 2), {
        status: 404,
        headers: { ...headers, "cache-control": "no-store" },
      });
    }
    return new Response(JSON.stringify({ schema: snapshot.schema, generated_at: snapshot.generated_at, subject: row, served }, null, 2), {
      status: 200,
      headers,
    });
  }
  return new Response(JSON.stringify({ ...snapshot, served }, null, 2), { status: 200, headers });
};
