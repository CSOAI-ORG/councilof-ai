import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { doorsFromManifest, settleFor } from "./payEveryDoor";
import { SettleCell } from "../pages/PayEveryDoor";

const now = "2026-10-07T12:00:00.000Z";
const resource = "https://councilof.ai/api/request-attestation";
const door = doorsFromManifest({ resources: [{ method: "GET", url: resource, paid_for: "issuance" }] })[0];
// Relevant expected fields from temporal-v2 revenue.temporal.test.ts:133–143.
// This describes an offline contract fixture, not a live/paid observation.
const unknownReading = {
  kind: "UNMEASURED" as const, as_of: now, rows: [],
  observed_rows: [{ resource, last_settle: now, tx: "known" }],
  coverage: { complete: true },
  semantic_coverage: { complete: false, time_complete: false, resource_complete: true },
  reason: "incomplete settlement time or resource coverage; observed rows cannot establish a latest settle or an absent record",
};

describe("door consumers preserve semantic uncertainty", () => {
  it("does not interpret empty definitive rows or readable observations as latest or absence", () => {
    expect(settleFor(door, unknownReading)).toEqual({ status: "UNMEASURED", lastSettle: null, reason: unknownReading.reason });
    const html = renderToStaticMarkup(React.createElement(SettleCell, {
      settle: settleFor(door, unknownReading), state: { kind: "idle" }, now: Date.parse(now),
    }));
    expect(html).toContain("UNMEASURED");
    expect(html).not.toContain("None on record");
    expect(html).not.toContain("2026-10-07");
    expect(html).not.toContain("Settled this session");
  });
  it("still permits absence for a complete empty measured reading", () => {
    const settle = settleFor(door, { kind: "MEASURED", as_of: now, rows: [], reason: null });
    expect(settle.status).toBe("NONE_ON_RECORD");
    const html = renderToStaticMarkup(React.createElement(SettleCell, { settle, state: { kind: "idle" }, now: Date.parse(now) }));
    expect(html).toContain("None on record");
  });
});
