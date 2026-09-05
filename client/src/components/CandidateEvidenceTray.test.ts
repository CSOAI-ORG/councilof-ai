import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("candidate receipt network boundary", () => {
  it("keeps the receipt local and offers no browser network intake", () => {
    const source = readFileSync(
      resolve(__dirname, "./CandidateEvidenceTray.tsx"),
      "utf8",
    );
    expect(source).not.toContain("witness_hash");
    expect(source).not.toContain("Open witness challenge");
    expect(source).not.toContain("manual x402 request");
    expect(source).not.toContain("submitCandidateForMeasurement");
    expect(source).not.toContain("Submit for independent review");
    expect(source).not.toContain("submissionConsented");
    expect(source).toContain(
      "Network intake is unavailable in this release; keep or download",
    );
    expect(source).toContain(
      "Witness intake unavailable; no payment or anchor requested.",
    );
  });
});
