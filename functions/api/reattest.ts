/**
 * /api/reattest — schedule and fetch re-measurement reminders (delta cards).
 *
 * POST { action: "schedule", workspace, system_id, schedule_days?: 30, baseline_report_id? }
 * GET  ?workspace=ws_xxx  → systems due for re-attest
 * POST { action: "record", workspace, system_id, report_id, tier }  → after re-measure
 */
interface Env {
  WORKSPACE?: KVNamespace;
}

type ReattestRecord = {
  system_id: string;
  system_name: string;
  scheduled_at: string;
  next_reattest_at: string;
  baseline_report_id?: string;
  last_report_id?: string;
  last_tier?: string;
  delta?: { tier_change?: string; score_change?: number };
};

function schedKey(workspace: string) {
  return `reattest:${workspace}`;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const action = String(body.action || "schedule");
  const workspace = String(body.workspace || ctx.request.headers.get("X-Workspace-Token") || "");
  if (!workspace) return Response.json({ error: "workspace required" }, { status: 400 });

  if (!ctx.env.WORKSPACE) {
    return Response.json({
      ok: true,
      stored: false,
      reason: "no WORKSPACE KV bound",
      scheduled: {
        system_id: body.system_id,
        next_reattest_at: new Date(Date.now() + (Number(body.schedule_days) || 30) * 86400000).toISOString(),
        note: "Schedule returned in response — persist client-side until KV bound",
      },
    });
  }

  const raw = await ctx.env.WORKSPACE.get(schedKey(workspace));
  const schedules: ReattestRecord[] = raw ? JSON.parse(raw) : [];

  if (action === "schedule") {
    const system_id = String(body.system_id || "");
    const system_name = String(body.system_name || system_id);
    const days = Number(body.schedule_days) || 30;
    const next = new Date(Date.now() + days * 86400000).toISOString();
    const rec: ReattestRecord = {
      system_id,
      system_name,
      scheduled_at: new Date().toISOString(),
      next_reattest_at: next,
      baseline_report_id: body.baseline_report_id ? String(body.baseline_report_id) : undefined,
    };
    const idx = schedules.findIndex((s) => s.system_id === system_id);
    if (idx >= 0) schedules[idx] = { ...schedules[idx], ...rec };
    else schedules.push(rec);
    await ctx.env.WORKSPACE.put(schedKey(workspace), JSON.stringify(schedules));
    return Response.json({
      ok: true,
      stored: true,
      schedule: rec,
      reminder: `Re-measure ${system_name} by ${next.slice(0, 10)} — free, unpurchasable`,
    });
  }

  if (action === "record") {
    const system_id = String(body.system_id || "");
    const idx = schedules.findIndex((s) => s.system_id === system_id);
    if (idx < 0) return Response.json({ error: "no schedule for system" }, { status: 404 });
    const prev = schedules[idx];
    const newTier = String(body.tier || "");
    const newScore = Number(body.compliance_score) || 0;
    schedules[idx] = {
      ...prev,
      last_report_id: String(body.report_id || ""),
      last_tier: newTier,
      next_reattest_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      delta: {
        tier_change: prev.last_tier && prev.last_tier !== newTier ? `${prev.last_tier} → ${newTier}` : undefined,
        score_change: prev.last_report_id ? newScore : undefined,
      },
    };
    await ctx.env.WORKSPACE.put(schedKey(workspace), JSON.stringify(schedules));
    return Response.json({ ok: true, stored: true, delta_card: schedules[idx] });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
};

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const workspace = url.searchParams.get("workspace") || ctx.request.headers.get("X-Workspace-Token");
  if (!workspace) return Response.json({ error: "workspace required" }, { status: 400 });

  if (!ctx.env.WORKSPACE) {
    return Response.json({ bound: false, due: [], upcoming: [] });
  }

  const raw = await ctx.env.WORKSPACE.get(schedKey(workspace));
  const schedules: ReattestRecord[] = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const due = schedules.filter((s) => new Date(s.next_reattest_at).getTime() <= now);
  const upcoming = schedules.filter((s) => new Date(s.next_reattest_at).getTime() > now);

  return Response.json({
    bound: true,
    due,
    upcoming,
    doctrine: "Re-measurement is free — certification is not the product; staying current is.",
  });
};
