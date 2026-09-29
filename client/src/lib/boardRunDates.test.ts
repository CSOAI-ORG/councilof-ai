import { describe, expect, it } from "vitest";
import { axisRunDate, boardRunDates } from "./boardRunDates";

// The shape GET /api/gspc served on 2026-09-28 (trimmed to the fields the line reads).
const LIVE = {
  measured_on: { date: "behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact axes 2026-08-25" },
  axes: [
    { axis: "governance", family: "gspc", status: "MEASURED" },
    { axis: "jail", family: "gspc", status: "MEASURED" },
    {
      axis: "effect-binding",
      family: "gspc",
      kind: "deterministic-facts",
      status: "MEASURED",
      evidence_url: "/interop/effect-binding-server-probe-2026-09-22.signed.json",
      note: "MEASURED 2026-09-22 (council-os/ADR-002-axis-23-effect-binding.md, ruling appended the same day).",
    },
    { axis: "reserve-attestation", family: "financial", kind: "deterministic-facts", status: "MEASURED", facts_as_of: "2026-09-07T11:30:35Z" },
  ],
};

describe("boardRunDates", () => {
  it("adds the effect-binding run the signed line does not name, read from the axis", () => {
    expect(boardRunDates(LIVE)).toBe(
      "behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact axes 2026-08-25 · effect-binding 2026-09-22",
    );
  });

  it("never adds an axis the line already names, a fleet axis, a financial axis or an unmeasured one", () => {
    const d = {
      measured_on: { date: "behavioural axes 2026-08-12 · effect-binding 2026-09-22" },
      axes: [...LIVE.axes, { axis: "new-slot", family: "gspc", kind: "deterministic-facts", status: "UNMEASURED", note: "MEASURED 2026-10-01" }],
    };
    expect(boardRunDates(d)).toBe("behavioural axes 2026-08-12 · effect-binding 2026-09-22");
  });

  it("leaves out an axis whose date cannot be read rather than guessing one", () => {
    const d = { measured_on: { date: "x" }, axes: [{ axis: "q", family: "gspc", kind: "deterministic-facts", status: "MEASURED" }] };
    expect(boardRunDates(d)).toBe("x");
  });

  it("returns null when there is nothing to say", () => {
    expect(boardRunDates(null)).toBeNull();
    expect(boardRunDates({ measured_on: { date: "  " }, axes: [] })).toBeNull();
  });

  it("reads the producer stamp before the note and the note before the file name", () => {
    expect(axisRunDate({ facts_as_of: "2026-09-07T11:30:35Z", note: "MEASURED 2026-01-01" })).toBe("2026-09-07");
    expect(axisRunDate({ note: "MEASURED 2026-09-22 (x)", evidence_url: "/a-2026-01-01.json" })).toBe("2026-09-22");
    expect(axisRunDate({ evidence_url: "/interop/effect-binding-server-probe-2026-09-22.signed.json" })).toBe("2026-09-22");
    expect(axisRunDate({})).toBeNull();
  });
});
