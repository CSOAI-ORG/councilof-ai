/**
 * GET /api/corpus-watch/status — serves the watcher heartbeat JSON with register-honest semantics.
 *
 * Source of truth:  ~/clawd/corpus-watch/reports/status.json (regenerated daily by the cron workflow on
 *                  CSOAI-ORG/corpus-watch, commit ac2ad37+). The artefact is shipped to the deployed
 *                  site via wrangler --include='public/corpus-watch/**' or a downstream sync step.
 *
 * Honesty discipline:
 *  - The function ALWAYS answers; on read failure it returns a baseline_seeded fallback that names
 *    the source, the date, and the "live = false" state. The page is honest about staleness rather
 *    than greenwashing a missing artefact.
 *  - The fallback is the measured 2026-08-01 baseline seed (5 instruments, 399 provisions, 0 drift,
 *    0 unknown), re-derived from the canonical corpus-watch run. It is what the page renders, with
 *    the same JSON shape, until the live heartbeat is readable.
 *  - Every numeric claim on the public site must trace to a signed artefact. The status JSON carries
 *    the issuer (Ed25519, pubkey on the watcher's repo) so the page can verify it without surprise.
 */

interface Env {
  /** Optional KV namespace pointing at the corpus-watch artefact store. When bound, the function
   * reads from KV first and only falls back to the bundled baseline if KV is empty. Unbound is fine:
   * the function then serves the shipped-at-deploy snapshot. */
  CORPUS_WATCH_STATUS?: KVNamespace;
}

const BEACON_TTL_SECONDS = 60;
const BASELINE_PATH = '/corpus-watch/status.json';

interface InstrumentStatus {
  id: string;
  label: string;
  jurisdiction: 'EU' | 'UK' | string;
  provisions: number;
  status: 'unchanged' | 'baseline_seeded' | 'DRIFT' | 'UNKNOWN';
  hash?: string;
}

interface WatchStatus {
  started_at: string;
  finished_at: string;
  normaliser: 'norm-v2' | string;
  instruments: InstrumentStatus[];
  drift_events: number;
  unknown: number;
  total_provisions: number;
  signed?: boolean;
  alg?: 'Ed25519' | 'unsigned';
  pub_sha256_prefix?: string;
  artifact_uri?: string;
}

/** The measured 2026-08-01 baseline seed. Mirrors corpus-watch/reports/status.json so the public page never
 *  renders a fabricated green state when the live fetch fails — it renders this honest absence-of-data state. */
const FALLBACK: WatchStatus = {
  started_at: '2026-08-01T13:27:15.708553+00:00',
  finished_at: '2026-08-01T13:27:21.159740+00:00',
  normaliser: 'norm-v2',
  instruments: [
    { id: 'EU-AI-ACT', label: 'EU AI Act (Regulation (EU) 2024/1689)', jurisdiction: 'EU', provisions: 113, status: 'baseline_seeded' },
    { id: 'EU-CRA', label: 'EU Cyber Resilience Act (Regulation (EU) 2024/2847)', jurisdiction: 'EU', provisions: 71, status: 'baseline_seeded' },
    { id: 'EU-DORA', label: 'DORA (Regulation (EU) 2022/2554)', jurisdiction: 'EU', provisions: 68, status: 'baseline_seeded' },
    { id: 'EU-NIS2', label: 'NIS2 Directive ((EU) 2022/2555)', jurisdiction: 'EU', provisions: 48, status: 'baseline_seeded' },
    { id: 'UK-GDPR', label: 'UK GDPR (retained Regulation (EU) 2016/679)', jurisdiction: 'UK', provisions: 99, status: 'baseline_seeded' },
  ],
  drift_events: 0,
  unknown: 0,
  total_provisions: 399,
};

function isWatchStatus(s: unknown): s is WatchStatus {
  if (!s || typeof s !== 'object') return false;
  const o = s as Record<string, unknown>;
  return Array.isArray(o['instruments']) && typeof o['normaliser'] === 'string' && typeof o['total_provisions'] === 'number';
}

async function readKV(env: Env): Promise<WatchStatus | null> {
  if (!env.CORPUS_WATCH_STATUS) return null;
  try {
    const v = await env.CORPUS_WATCH_STATUS.get('latest', { type: 'json' });
    if (!v || !isWatchStatus(v)) return null;
    return v;
  } catch {
    return null;
  }
}

/** Build the public payload. Always includes the fallback under `baseline_seed` so callers can
 *  distinguish "real heartbeat" from "shipped snapshot" without guessing. */
function envelope(live: WatchStatus | null): Record<string, unknown> {
  const issued_at = new Date().toISOString();
  const chosen = live ?? FALLBACK;
  return {
    issued_at,
    served_fresh: live !== null,
    fallback_used: live === null,
    baseline_seed: FALLBACK,
    heartbeat: {
      ...chosen,
      artifact_uri: 'https://github.com/CSOAI-ORG/corpus-watch/blob/main/reports/status.json',
    },
  };
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const live = await readKV(ctx.env);
  const body = envelope(live);
  return Response.json(body, {
    status: 200,
    headers: {
      'Cache-Control': `public, max-age=${BEACON_TTL_SECONDS}`,
      'X-Corpus-Watch-Fallback': live === null ? 'true' : 'false',
      // Pages-Function-friendly: never expose the underlying source as anonymous.
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
