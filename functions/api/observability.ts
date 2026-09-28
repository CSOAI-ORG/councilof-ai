/**
 * GET /api/observability — machine-readable estate health.
 *
 * Every value is derived from a committed artifact or a live endpoint read.
 * No count is typed by hand. No timestamp is `new Date()`. Absent data is
 * null, never substituted.
 *
 * This is the observability surface the typed-harness unification (#2391)
 * needs: connector freshness, queue depth, signed-root lag, publication
 * status, and paid-delivery state — one endpoint a dashboard or alerting
 * system can poll.
 */

import rootJson from "../../public/root.json";
import cardIndex from "../../public/signed/card_index.json";
import mcpTrust from "../../public/interop/mcp-trust/latest.json";
import x402Trust from "../../public/interop/x402-trust/latest.json";
import mcpDirs from "../../public/interop/mcp-directories.json";
import podHealth from "../../public/interop/pod-health.json";
import pubHealth from "../../public/publisher-health.json";
import { buildWorker } from "./worker";

type Env = { RUNPOD_WORKER_HEALTH_URL?: string; WORKER_STATE_KV?: KVNamespace };

interface ConnectorFreshness {
  id: string;
  source: string;
  as_of: string | null;
  as_of_field: string;
  age_hours: number | null;
}

function readAsOf(obj: Record<string, unknown>, ...fields: string[]): { value: string | null; field: string } {
  for (const f of fields) {
    const v = obj[f];
    if (typeof v === "string" && v.length >= 8) return { value: v, field: f };
  }
  return { value: null, field: fields[0] ?? "unknown" };
}

function ageHours(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return ms >= 0 ? Math.round((ms / 3_600_000) * 10) / 10 : null;
}

function connector(id: string, source: string, obj: Record<string, unknown>, ...fields: string[]): ConnectorFreshness {
  const { value, field } = readAsOf(obj, ...fields);
  return { id, source, as_of: value, as_of_field: field, age_hours: ageHours(value) };
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const root = rootJson as Record<string, unknown>;
  const cards = (cardIndex as Record<string, unknown>) as { cards?: unknown[] };
  const mcp = mcpTrust as Record<string, unknown>;
  const x402 = x402Trust as Record<string, unknown>;
  const dirs = mcpDirs as Record<string, unknown>;
  const pod = podHealth as Record<string, unknown>;
  const pub = pubHealth as Record<string, unknown>;

  // Worker state (live or stale fallback)
  const worker = await buildWorker(env);
  const workerRecord = worker as unknown as Record<string, unknown>;
  const workerData =
    workerRecord.worker && typeof workerRecord.worker === "object"
      ? workerRecord.worker as Record<string, unknown>
      : null;

  // Signed cards: how many are signed vs unsigned
  const cardRows: Array<{ signed?: boolean }> = Array.isArray(cards.cards) ? cards.cards : [];
  const signedCount = cardRows.filter((c) => c.signed).length;
  const unsignedCount = cardRows.length - signedCount;

  // Root state
  const rootCardCount = typeof root.card_count === "number" ? root.card_count : null;
  const rootAsOf = typeof root.as_of === "string" ? root.as_of : null;

  // Connector freshness
  const connectors: ConnectorFreshness[] = [
    connector("public-root", "public/root.json", root as Record<string, unknown>, "as_of"),
    connector("signed-cards", "public/signed/card_index.json", cards as unknown as Record<string, unknown>, "as_of", "generated_at"),
    connector("mcp-trust", "public/interop/mcp-trust/latest.json", mcp, "as_of"),
    connector("x402-trust", "public/interop/x402-trust/latest.json", x402, "as_of"),
    connector("mcp-directories", "public/interop/mcp-directories.json", dirs, "as_of", "generated_at"),
    connector("pod-health", "public/interop/pod-health.json", pod, "as_of"),
    connector("publisher-health", "public/publisher-health.json", pub, "as_of"),
  ];

  // Stalest connector
  const stalest = connectors.reduce<{ id: string; age_hours: number | null }>(
    (max, c) => (c.age_hours != null && (max.age_hours == null || c.age_hours > max.age_hours) ? { id: c.id, age_hours: c.age_hours } : max),
    { id: "none", age_hours: null },
  );

  // Queue depth from worker (if live)
  const queue = worker.status === "LIVE" && workerData
    ? {
        depth: typeof workerData.jobs_total === "number" ? workerData.jobs_total : null,
        successful_runs: typeof workerData.successful_runs === "number" ? workerData.successful_runs : null,
        failed_runs: typeof workerData.failed_runs === "number" ? workerData.failed_runs : null,
        transport_errors: typeof workerData.transport_errors === "number" ? workerData.transport_errors : null,
        state: typeof workerData.state === "string" ? workerData.state : null,
      }
    : { depth: null, successful_runs: null, failed_runs: null, transport_errors: null, state: null };

  // Publication lag: root as_of vs pod last_success_at
  const lastSuccess = worker.status === "LIVE" && workerData
    ? workerData.last_success_at as string | undefined
    : undefined;
  const rootLagHours = rootAsOf && lastSuccess ? ageHours(rootAsOf) : null;

  const body = {
    schema: "csoai.observability/0.1",
    title: "CSOAI estate observability — machine-readable health",
    endpoint: "/api/observability",
    contract:
      "Every value is derived from a committed artifact or live endpoint read. " +
      "No count is typed by hand. No timestamp is new Date(). Absent data is null, never substituted.",

    connectors,
    stalest_connector: stalest,

    root: {
      card_count: rootCardCount,
      as_of: rootAsOf,
      age_hours: ageHours(rootAsOf),
    },

    signed_cards: {
      total: cardRows.length,
      signed: signedCount,
      unsigned: unsignedCount,
    },

    worker: {
      status: worker.status,
      stale: (worker as Record<string, unknown>).stale === true,
      stale_age_seconds: (worker as Record<string, unknown>).stale_age_seconds ?? null,
      state: queue.state,
    },

    queue,

    publication_lag: {
      root_age_hours: rootLagHours,
      note: "Hours since root.json as_of. A large number means the root has not been refreshed recently.",
    },

    mcp_trust: {
      total: typeof mcp.counts === "object" && mcp.counts ? (mcp.counts as Record<string, unknown>).total ?? null : null,
      partial: mcp.partial ?? false,
      as_of: mcp.as_of ?? null,
      age_hours: ageHours(mcp.as_of as string | null),
    },

    x402_trust: {
      total: typeof x402.counts === "object" && x402.counts ? (x402.counts as Record<string, unknown>).total ?? null : null,
      as_of: x402.as_of ?? null,
      age_hours: ageHours(x402.as_of as string | null),
    },

    stablecoin_universe: typeof pub.stablecoin_universe === "object" && pub.stablecoin_universe
      ? {
          status: (pub.stablecoin_universe as Record<string, unknown>).status ?? null,
          assets: (pub.stablecoin_universe as Record<string, unknown>).assets ?? null,
        }
      : null,

    staged_leaves: typeof pub.staged_leaves === "object" && pub.staged_leaves
      ? {
          dirs: (pub.staged_leaves as Record<string, unknown>).dirs ?? null,
          n_leaves: (pub.staged_leaves as Record<string, unknown>).n_leaves ?? null,
        }
      : null,

    not_covered: [
      "Cost per artifact — not tracked in committed files.",
      "Paid-delivery settlement status — /api/revenue is the authority.",
      "HF/Kaggle publication freshness — not in committed artifacts.",
      "RunPod billing — not in committed artifacts.",
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
};
