/**
 * /api/body-state — reports the last run / last success / last failure per
 * workflow, derived live from the public GitHub API (no token needed for
 * public repo run lists).
 *
 * A stranger can check every stage: timestamp per workflow, null + reason when
 * unread (rate-limit, network, workflow deleted). No cached claims in the repo.
 */

const REPO = "CSOAI-ORG/councilof-ai";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

interface RunState {
  workflow: string;
  workflow_id: number;
  last_run_at: string | null;
  last_status: string | null;
  last_conclusion: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_cancelled_at: string | null;
  state: "ok" | "running" | "failing" | "unread";
  reason?: string;
}

export const onRequestGet: PagesFunction = async () => {
  const out: RunState[] = [];
  let error: string | null = null;

  try {
    const listRes = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows?per_page=100`, {
      headers: { "User-Agent": "CSOAI-body-state", Accept: "application/vnd.github+json" },
    });
    if (!listRes.ok) {
      return json({ schema: "csoai.body-state/0.1", status: "UNAVAILABLE", reason: `workflow list HTTP ${listRes.status}` }, 503);
    }
    const list = (await listRes.json()) as { workflows: { id: number; name: string; path: string }[] };

    const results = await Promise.allSettled(
      list.workflows.map(async (w) => {
        const r = await fetch(
          `https://api.github.com/repos/${REPO}/actions/workflows/${w.id}/runs?per_page=1`,
          { headers: { "User-Agent": "CSOAI-body-state", Accept: "application/vnd.github+json" } },
        );
        if (!r.ok) throw new Error(`runs HTTP ${r.status}`);
        const j = (await r.json()) as { workflow_runs: Array<{ status: string; conclusion: string | null; run_number: number; created_at: string | null; updated_at: string | null }> };
        const last = j.workflow_runs?.[0];
        if (!last) {
          out.push({ workflow: w.name, workflow_id: w.id, last_run_at: null, last_status: null, last_conclusion: null, last_success_at: null, last_failure_at: null, last_cancelled_at: null, state: "ok", reason: "no runs yet" });
          return;
        }
        const successAt = last.conclusion === "success" ? last.updated_at : null;
        const failureAt = last.conclusion === "failure" ? last.updated_at : null;
        const cancelledAt = last.conclusion === "cancelled" ? last.updated_at : null;
        const running = last.status === "in_progress" || last.status === "queued" || last.status === "pending";
        out.push({
          workflow: w.name, workflow_id: w.id, last_run_at: last.created_at,
          last_status: last.status, last_conclusion: last.conclusion,
          last_success_at: successAt, last_failure_at: failureAt, last_cancelled_at: cancelledAt,
          state: failureAt ? "failing" : running ? "running" : "ok",
        });
      }),
    );

    const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    for (const r of rejected) {
      out.push({
        workflow: "unresolved", workflow_id: -1, last_run_at: null, last_status: null,
        last_conclusion: null, last_success_at: null, last_failure_at: null,
        last_cancelled_at: null, state: "unread", reason: String(r.reason).slice(0, 120),
      });
    }
  } catch (e) {
    error = String(e).slice(0, 200);
  }

  return json({
    schema: "csoai.body-state/0.1",
    as_of: new Date().toISOString(),
    source: `https://api.github.com/repos/${REPO}/actions/workflows`,
    total: out.length,
    error: error,
    stages: out.sort((a, b) => (a.workflow ?? "").localeCompare(b.workflow ?? "")),
    honesty: "Stage timestamps are the only liveness claim. null + reason = unread.",
  });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
