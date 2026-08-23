/**
 * POST /api/assess/batch — portfolio measurement over multiple AI systems.
 *
 * Runs the same deterministic assess engine per system × frameworks in scope.
 * Measurement, not certification. Returns per-system cards + portfolio summary.
 */
import { runAssess, signPayload } from "../../lib/assess-engine";

interface Env {
  ASSESS_SIGNING_KEY_PKCS8_B64?: string;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const systems = Array.isArray(body.systems) ? body.systems : [];
  if (!systems.length) {
    return Response.json({ error: "systems[] required — at least one AI system" }, { status: 400 });
  }
  if (systems.length > 50) {
    return Response.json({ error: "max 50 systems per batch" }, { status: 400 });
  }

  const org_name = body.org_name ? String(body.org_name) : null;
  const frameworks = Array.isArray(body.frameworks_in_scope) ? body.frameworks_in_scope.map(String) : [];
  const b64 = ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64;

  const results = [];
  for (const raw of systems) {
    const sys = raw as Record<string, unknown>;
    const input = {
      system: String(sys.description || sys.system || sys.name || ""),
      purpose: String(sys.purpose || ""),
      domain: String(sys.domain || ""),
      human_oversight: sys.human_oversight !== false,
      logging: sys.logging !== false,
      claimed_controls: Array.isArray(sys.claimed_controls) ? sys.claimed_controls.map(String) : [],
      frameworks_in_scope: Array.isArray(sys.frameworks) ? sys.frameworks.map(String) : frameworks,
      system_id: sys.id ? String(sys.id) : undefined,
      org_name: org_name || undefined,
    };

    const out = await runAssess(input);
    if (out.status === 400) {
      results.push({ system_id: input.system_id, name: sys.name, error: out.error, detail: out.detail });
      continue;
    }
    const sig = await signPayload(out.signed_payload, b64);
    results.push({
      system_id: input.system_id,
      name: sys.name || input.system_id,
      ...out.payload,
      signed_payload: out.signed_payload,
      ...sig,
    });
  }

  const measured = results.filter((r) => !("error" in r && r.error));
  const prohibited = measured.filter((r) => r.tier === "PROHIBITED").length;
  const highRisk = measured.filter((r) => r.tier === "HIGH_RISK").length;
  const avgScore = measured.length
    ? Math.round(measured.reduce((s, r) => s + (Number(r.compliance_score) || 0), 0) / measured.length)
    : 0;

  return Response.json(
    {
      schema: "csoai.portfolio-assess/0.1",
      assessed_at: new Date().toISOString(),
      org_name,
      frameworks_in_scope: frameworks,
      portfolio: {
        total: systems.length,
        measured: measured.length,
        errors: results.length - measured.length,
        prohibited,
        high_risk: highRisk,
        avg_compliance_score: avgScore,
      },
      systems: results,
      next_steps: {
        fix_gaps: "https://councilof.ai/remediation-partners",
        re_reattest: "POST /api/reattest { workspace, system_id, schedule_days: 30 }",
        council_os: "https://councilof.ai/coliseum?task=enterprise-start",
      },
      doctrine:
        "Training loop — measure, fix independently, re-measure. Not a conformity certificate.",
    },
    { headers: { "cache-control": "no-store" } },
  );
};
