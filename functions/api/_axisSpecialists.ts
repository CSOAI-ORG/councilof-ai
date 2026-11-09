import INDEX from "../../public/axis-specialists/index.json";
import BUNDLE from "../../public/axis-specialists/bundle.json";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
  "x-content-type-options": "nosniff",
};

export type AxisSpecialistAudit = {
  axis: string;
  specialist: { id: string; cluster_id: string };
  summary: { audit_state: string; findings: number };
  human_gate: { decision: string; may_apply: boolean };
  improvement_proposals: Array<{ state: string }>;
};

export function specialistIndex(): typeof INDEX {
  return INDEX;
}

export function specialistByAxis(axis: string): AxisSpecialistAudit | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(axis)) return null;
  return (BUNDLE.specialists as unknown as AxisSpecialistAudit[]).find((item) => item.axis === axis) ?? null;
}

export function specialistJson(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

export function specialistNotFound(axis: string): Response {
  return specialistJson({
    schema: "csoai.capability-state/0.1",
    state: "NOT_FOUND",
    axis,
    available: INDEX.specialists.map((item) => item.axis),
    note: "No axis row or specialist was inferred. Use an exact axis id from /api/axis-specialists.",
  }, 404);
}
