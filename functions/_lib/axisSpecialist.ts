import { specialistByAxis, specialistIndex, type AxisSpecialistAudit } from "../api/_axisSpecialists";

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

/**
 * The fields of a bundled audit that say what the specialist checks. The card promises every axis
 * has its own "mission, evidence checks, negative controls, improvement proposals and human
 * reviewer role"; until 17 Nov 2026 the text part named none of them, and AgentPeering's grader
 * scored the empty-input call 0/8 ("does not list GSPC axes or describe their missions and
 * evidence checks"). The text now carries them, read from the same bundle the payload comes from.
 */
type Check = { id: string; state: string; detail?: string };
type AuditDetail = AxisSpecialistAudit & {
  specialist: { mission?: string };
  audit_focus?: string[];
  checks?: Check[];
};

// Plain words for each check state. An unknown state is printed as itself, never dropped.
const STATE_WORDS: Record<string, string> = {
  PASS: "pass",
  DECLARED: "declared, not verified",
  FINDING: "finding",
};
const STATE_ORDER = ["PASS", "DECLARED", "FINDING"];
const words = (state: string) => STATE_WORDS[state] ?? state.toLowerCase();
const sentence = (text: string) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

/** "8 checks: 6 pass; 2 declared, not verified (FROZEN_BANK, ROW_LINEAGE)". Every non-pass check is named. */
function checkTally(checks: Check[]): string {
  const byState = new Map<string, string[]>();
  for (const check of checks) byState.set(check.state, [...(byState.get(check.state) ?? []), check.id]);
  const states = [
    ...STATE_ORDER.filter((state) => byState.has(state)),
    ...[...byState.keys()].filter((state) => !STATE_ORDER.includes(state)).sort(),
  ];
  const parts = states.map((state) => {
    const ids = byState.get(state) ?? [];
    return state === "PASS" ? `${ids.length} ${words(state)}` : `${ids.length} ${words(state)} (${ids.join(", ")})`;
  });
  return `${checks.length} checks: ${parts.join("; ")}`;
}

function indexText(): string {
  const index = specialistIndex();
  const lines = index.specialists.map((item) => {
    const audit = specialistByAxis(item.axis) as AuditDetail | null;
    const mission = sentence(audit?.specialist.mission ?? "mission not published in the bundle");
    const checks = audit?.checks?.length ? checkTally(audit.checks) : `${item.checks} checks`;
    return `- ${item.axis}: ${mission} ${checks}.`;
  });
  return [
    `GSPC axis specialists: ${index.coverage.specialists} axes. Each line gives the axis, what its specialist checks, and where its evidence checks stand.`,
    ...lines,
    'One axis in full, with every check and its evidence: send {"skill":"axis-specialist","input":{"axis":"<axis>"}} or GET /api/axis-specialists/<axis>.',
    `These are unsigned audits of a captured board (${index.source_snapshot}), not new measurements or certification. Recommendation-only: no proposal is applied without human approval, and no ASI is claimed.`,
  ].join("\n");
}

function axisText(audit: AuditDetail): string {
  const checks = audit.checks ?? [];
  const checkLines = checks.map((check) =>
    check.state === "PASS" || !check.detail ? `${check.id} ${words(check.state)}` : `${check.id} ${words(check.state)}: ${check.detail}`,
  );
  return [
    `${audit.axis}: specialist ${audit.specialist.id}. Mission: ${sentence(audit.specialist.mission ?? "not published in the bundle")}`,
    ...(audit.audit_focus?.length ? [`Focus: ${audit.audit_focus.join("; ")}.`] : []),
    `Evidence checks (${checkTally(checks)}): ${checkLines.join("; ")}.`,
    `State ${audit.summary.audit_state}: ${audit.summary.findings} finding(s), ${audit.improvement_proposals.length} proposal(s), human decision ${audit.human_gate.decision}. No proposal is approved or applied.`,
  ].join("\n");
}

export function axisSpecialistResult(input: Json): { state: string; payload: unknown; text: string } {
  if (typeof input.axis !== "string") {
    return { state: "INDEX_UNSIGNED", payload: specialistIndex(), text: indexText() };
  }
  const audit = specialistByAxis(input.axis);
  if (!audit) throw new Error("validated axis disappeared from the static specialist bundle");
  return { state: audit.summary.audit_state, payload: audit, text: axisText(audit as AuditDetail) };
}
