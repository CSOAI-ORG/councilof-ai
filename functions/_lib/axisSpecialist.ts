import { specialistByAxis, specialistIndex } from "../api/_axisSpecialists";

type Json = Record<string, unknown>;
const keys = (input: Json, required: string[], optional: string[] = []) => {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.prototype.hasOwnProperty.call(input, key)) && Object.keys(input).every((key) => allowed.has(key));
};

export function validateAxisSpecialistInput(input: Json): string | null {
  if (!keys(input, [], ["axis"])) return "axis-specialist input accepts only optional axis";
  if (input.axis === undefined) return null;
  if (typeof input.axis !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.axis)) {
    return "axis-specialist axis must be an exact kebab-case axis id";
  }
  return specialistByAxis(input.axis) ? null : `unknown axis ${input.axis}; read /api/axis-specialists for the exact set`;
}

export function axisSpecialistResult(input: Json): { state: string; payload: unknown; text: string } {
  if (typeof input.axis !== "string") {
    const payload = specialistIndex();
    return {
      state: "INDEX_UNSIGNED",
      payload,
      text: `Axis specialist index: ${payload.coverage.specialists} bounded specialists, each with its own logical cluster and H.I.M. HOLD gate. No proposal is applied; this is an audit index, not ASI or a new measurement.`,
    };
  }
  const audit = specialistByAxis(input.axis);
  if (!audit) throw new Error("validated axis disappeared from the static specialist bundle");
  return {
    state: audit.summary.audit_state,
    payload: audit,
    text: `${audit.specialist.id}: ${audit.summary.audit_state}; ${audit.summary.findings} finding(s), ${audit.improvement_proposals.length} proposal(s), human decision ${audit.human_gate.decision}. No proposal is approved or applied.`,
  };
}
