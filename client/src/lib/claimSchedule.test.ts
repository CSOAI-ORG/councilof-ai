import { describe, expect, it } from "vitest";
import { claimScheduleLabel } from "./claimSchedule";

describe("published claim schedule state", () => {
  it.each(["SCHEDULED", "DUE_NOT_RUN", "DUE_EXECUTION_UNVERIFIED", "COMPLETED", "RETRY_REQUIRED"])(
    "keeps %s visible beside the original scheduled date", state => {
      expect(claimScheduleLabel({ next_scheduled_read_state: state, next_scheduled_read: "2026-10-01T12:00:00Z" }))
        .toBe(`${state} · 2026-10-01`);
    },
  );
  it("does not turn missing schedule evidence into either completion or an unscheduled claim", () => {
    expect(claimScheduleLabel({})).toBe("UNVERIFIED");
    expect(claimScheduleLabel({ next_scheduled_read_state: "", next_scheduled_read: "2026-10-01" })).toBe("UNVERIFIED · 2026-10-01");
  });
  it("preserves an explicit unscheduled or future state without inventing a date", () => {
    expect(claimScheduleLabel({ next_scheduled_read_state: "UNSCHEDULED" })).toBe("UNSCHEDULED");
    expect(claimScheduleLabel({ next_scheduled_read_state: "HELD_FOR_REVIEW" })).toBe("HELD_FOR_REVIEW");
  });
});
