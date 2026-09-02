import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "AssessTool.tsx"), "utf8");

describe("/assess buyer intake", () => {
  it("collects the six scoping facts and never sells a rank", () => {
    for (const field of [
      "organization", "system", "intended_use", "evidence_needed", "target_date", "disclosure_preference",
    ]) expect(page).toContain(field);
    expect(page).toContain('kind: "measurement-enquiry"');
    expect(page).toContain("a grade is never sold");
    expect(page).toContain("not a booking, measurement, score");
    expect(page).not.toMatch(/Paddle\.Checkout|paddle-js|£79|£499|Run signed measurement/i);
  });

  it("only shows success after the API confirms durable storage", () => {
    expect(page).toContain("body.stored !== true");
    expect(page).toContain("Scope request received");
    expect(page).toContain("operator_state");
  });
});
