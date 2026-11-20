/**
 * POST /api/verify-count — fire-and-forget aggregate counter for the free card verifier.
 *
 * Verification on /gspc-verify (and the dashboard's verify pane) executes entirely client-side,
 * so executions were invisible: /api/counters published verify_page_executions as UNPUBLISHED
 * because nothing instrumented it. This endpoint is the smallest honest instrument:
 *
 * - The request body is IGNORED — never read, never parsed, never stored. No card id, no result,
 *   no timestamp beyond the counter bucket, nothing per-user crosses or persists.
 * - One daily UTC bucket per key (`verify-exec:YYYY-MM-DD`) in the WORKER_STATE_KV binding:
 *   read, +1, put back with a long TTL. Aggregate-only; the value is a floor, since a
 *   read-modify-write race on the same bucket can skip an increment. It is never a per-user count.
 * - Counting NEVER gates: every KV failure — an unbound binding, a throw, a bad value — still
 *   answers HTTP 204 with an empty body. Verification itself stays client-side and untouched.
 * - GET answers unavailable(...) (this is a POST-only endpoint); HEAD answers HEAD-of-GET per
 *   the ratchet in functions/api/_head.coverage.test.ts.
 *
 * The number only becomes public when the daily landing workflow
 * (.github/workflows/loops-verify-count.yml) commits the bucket into
 * public/interop/verify-executions-latest.json; /api/counters derives from that artifact
 * in-process and stays UNPUBLISHED until a real bucket exists.
 */
// @openapi-get-method-not-allowed — GET answers the capability statement at 405; POST is the door.
import { unavailable } from "./_unavailable";
import { headFromGet } from "./_head";

type Env = { WORKER_STATE_KV?: KVNamespace };

/** The counter bucket TTL. KV caps a TTL at one year per write; 400 days keeps a day bucket
 *  alive long enough for the daily landing workflow to retain or drop it on its own schedule. */
const BUCKET_TTL_SECONDS = 400 * 24 * 60 * 60;

/** The day bucket key, UTC. The date is the only time this endpoint ever handles. */
export function bucketKeyFor(now: Date = new Date()): string {
  return `verify-exec:${now.toISOString().slice(0, 10)}`;
}

/** Read the bucket's current value. Anything that is not a safe non-negative integer reads as 0:
 *  a corrupt or foreign value restarts the bucket rather than becoming a fabricated count. */
function currentCount(raw: string | null): number {
  if (raw == null) return 0;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

export async function countOne(env: Env, now: Date = new Date()): Promise<void> {
  const kv = env.WORKER_STATE_KV;
  if (!kv) return; // unbound binding: nothing is counted, nothing breaks
  try {
    const key = bucketKeyFor(now);
    const raw = await kv.get(key);
    const next = currentCount(raw) + 1;
    await kv.put(key, String(next), { expirationTtl: BUCKET_TTL_SECONDS });
  } catch {
    /* a failed count is a lost count, not a failed request: counting never gates */
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  await countOne(env);
  return new Response(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/verify-count",
  "Read verify executions live (aggregate counts land only as the committed daily artifact)",
  405,
);

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
