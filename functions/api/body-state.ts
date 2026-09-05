/**
 * /api/body-state — per-workflow last run / last success / last failure.
 *
 * Rate-limit safe: ONE unauthenticated call to /actions/runs?per_page=100 gives
 * the latest runs across every workflow; we group by workflow name. Workflows
 * with no run inside the window report state "no-recent-run" (honest, not a gap).
 * No cached claims: every value comes from this single live fetch.
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

interface StageState {
  workflow: string;
  workflow_id: number | null;
  last_run_at: string | null;
  last_status: string | null;
  last_conclusion: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_cancelled_at: string | null;
  state: "ok" | "running" | "failing" | "no-recent-run" | "unread";
  reason?: string;
}

export const onRequestGet: PagesFunction = async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=100`, {
      headers: { "User-Agent": "CSOAI-body-state", Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      return json({ schema: "csoai.body-state/0.1", status: "UNAVAILABLE", reason: `runs list HTTP ${res.status}` }, 503);
    }
    const j = (await res.json()) as {
      workflow_runs: Array<{
        name: string; workflow_id: number; status: string; conclusion: string | null;
        run_number: number; created_at: string | null; updated_at: string | null;
      }>;
    };

    const latestByWorkflow = new Map<string, (typeof j.workflow_runs)[number]>();
    for (const r of j.workflow_runs) {
      if (!latestByWorkflow.has(r.name)) latestByWorkflow.set(r.name, r);
    }

    const stages: StageState[] = [];
    for (const [name, last] of latestByWorkflow) {
      const successAt = last.conclusion === "success" ? last.updated_at : null;
      const failureAt = last.conclusion === "failure" ? last.updated_at : null;
      const cancelledAt = last.conclusion === "cancelled" ? last.updated_at : null;
      const running = last.status === "in_progress" || last.status === "queued" || last.status === "pending";
      stages.push({
        workflow: name,
        workflow_id: last.workflow_id,
        last_run_at: last.created_at,
        last_status: last.status,
        last_conclusion: last.conclusion,
        last_success_at: successAt,
        last_failure_at: failureAt,
        last_cancelled_at: cancelledAt,
        state: failureAt ? "failing" : running ? "running" : "ok",
      });
    }

    // Workflows that exist but have no run in the window (from the workflow list — one more
    // call is within limits and keeps the "no-recent-run" reporting honest; skip on failure).
    try {
      const listRes = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows?per_page=100`, {
        headers: { "User-Agent": "CSOAI-body-state", Accept: "application/vnd.github+json" },
      });
      if (listRes.ok) {
        const l = (await listRes.json()) as { workflows: { id: number; name: string }[] };
        const known = new Set(stages.map((s) => s.workflow));
        for (const w of l.workflows) {
          if (!known.has(w.name)) {
            stages.push({
              workflow: w.name, workflow_id: w.id, last_run_at: null, last_status: null,
              last_conclusion: null, last_success_at: null, last_failure_at: null,
              last_cancelled_at: null, state: "no-recent-run", reason: "no run in the latest-100 window",
            });
          }
        }
      }
    } catch {
      // list is optional; never fail the whole endpoint on it
    }

    return json({
      schema: "csoai.body-state/0.1",
      as_of: new Date().toISOString(),
      source: `https://api.github.com/repos/${REPO}/actions/runs?per_page=100`,
      method: "single-list grouping (rate-limit safe)",
      total: stages.length,
      stages: stages.sort((a, b) => a.workflow.localeCompare(b.workflow)),
      honesty: "Stage timestamps are the only liveness claim. no-recent-run + reason = nothing ran in the window; unread = API unreachable.",
    });
  } catch (e) {
    return json({
      schema: "csoai.body-state/0.1",
      as_of: new Date().toISOString(),
      status: "UNAVAILABLE",
      reason: String(e).slice(0, 200),
    }, 503);
  }
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
