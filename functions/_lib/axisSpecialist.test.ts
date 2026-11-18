/**
 * The axis-specialist text part must say what each axis's specialist checks.
 *
 * MEASURED 2026-11-16: AgentPeering's grader scored the empty-input call 0/8, "Reply does not list
 * GSPC axes or describe their missions and evidence checks". The card promises every axis has its own
 * mission and evidence checks; the text named no axis at all. Every expectation below is read from the
 * served bundle and index, never typed, so a correct board with more axes still passes.
 */
import { describe, expect, it } from "vitest";
import BUNDLE from "../../public/axis-specialists/bundle.json";
import INDEX from "../../public/axis-specialists/index.json";
import { axisSpecialistResult } from "./axisSpecialist";

type Check = { id: string; state: string; detail?: string };
const audits = BUNDLE.specialists as unknown as Array<{
  axis: string;
  specialist: { id: string; mission: string };
  audit_focus: string[];
  checks: Check[];
}>;

describe("axis-specialist replies say what each axis checks", () => {
  it("the empty-input index names every axis with its mission and every non-pass check", () => {
    const { state, payload, text } = axisSpecialistResult({});
    expect(state).toBe("INDEX_UNSIGNED");
    // The structured index is unchanged: the same object GET /api/axis-specialists serves.
    expect(payload).toBe(INDEX);
    expect(text).toContain(`${INDEX.coverage.specialists} axes`);
    for (const item of INDEX.specialists) {
      const audit = audits.find((a) => a.axis === item.axis);
      expect(audit, item.axis).toBeDefined();
      expect(text, item.axis).toContain(`- ${item.axis}: ${audit!.specialist.mission.trim()}`);
      expect(text, item.axis).toContain(`${audit!.checks.length} checks: `);
      for (const check of audit!.checks.filter((c) => c.state !== "PASS")) expect(text, item.axis).toContain(check.id);
    }
    // Plain words, not the internal gate vocabulary the old line led with.
    expect(text).not.toContain("H.I.M. HOLD gate");
    expect(text).toContain("not new measurements or certification");
  });

  it("one axis names its mission, its focus and every check with its state", () => {
    for (const audit of audits) {
      const { payload, text } = axisSpecialistResult({ axis: audit.axis });
      expect((payload as { axis: string }).axis).toBe(audit.axis);
      expect(text, audit.axis).toContain(`Mission: ${audit.specialist.mission.trim()}`);
      for (const focus of audit.audit_focus ?? []) expect(text, audit.axis).toContain(focus);
      for (const check of audit.checks) {
        expect(text, `${audit.axis} ${check.id}`).toContain(check.id);
        if (check.state !== "PASS" && check.detail) expect(text, `${audit.axis} ${check.id}`).toContain(check.detail);
      }
      expect(text, audit.axis).toContain("No proposal is approved or applied.");
    }
  });

  it("a check state the words table does not know is printed, never dropped", () => {
    const audit = audits[0];
    const original = audit.checks[0].state;
    audit.checks[0].state = "NEW_STATE";
    try {
      const { text } = axisSpecialistResult({ axis: audit.axis });
      expect(text).toContain(`${audit.checks[0].id} new_state`);
    } finally {
      audit.checks[0].state = original;
    }
  });
});
