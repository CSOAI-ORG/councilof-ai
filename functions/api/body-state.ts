/**
 * /api/body-state — returns SOURCE_RETIRED for the former GitHub workflow observer; current separate surfaces are /api/worker and /api/observability.
 *
 * The former source cannot describe current Cloudflare/RunPod operations.
 * Keep the old route explicit so a client cannot mistake a GitHub 403/404,
 * an empty list, or the response time for a healthy operating stage.
 */

const json = (body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export function buildBodyState() {
  return {
    schema: "csoai.body-state/0.2",
    status: "SOURCE_RETIRED",
    scope: "GitHub Actions per-workflow run history only",
    former_source: {
      repository: "CSOAI-ORG/councilof-ai",
      state: "NOT_A_CURRENT_OPERATIONS_SOURCE",
      last_run_at: null,
      last_success_at: null,
      last_failure_at: null,
    },
    total: null,
    stages: [],
    current_observability: {
      worker: "/api/worker",
      estate: "/api/observability",
      limitation: "The RunPod worker readback is compute state, not a replacement for per-workflow run history, signing, publication, or buyer evidence.",
    },
    honesty: "No stage timestamps are asserted here. Empty stages means this observer is retired; it does not mean no jobs are running.",
  };
}

export const onRequestGet: PagesFunction = async () => json(buildBodyState());
export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
