import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "LicensingAgreement.tsx"),
  "utf8",
);

describe("commercial legal surface (shipped LicensingAgreement.tsx)", () => {
  it("does not grant certification", () => {
    expect(src).not.toMatch(/Start Certification/);
    expect(src).not.toMatch(/CSOAI Certified Analyst/);
  });

  it("is a measurement licence with nobody-ranked-pays", () => {
    expect(src).toMatch(/Measurement licence/);
    expect(src).toMatch(/Nobody ranked pays/);
  });

  it("invoices three paid arms, not a public rank", () => {
    expect(src).toMatch(/Run \/ re-attest/);
    expect(src).toMatch(/Council Ledger/);
    expect(src).toMatch(/Council Data/);
    expect(src).toMatch(/never a purchased public rank/);
    expect(src).toMatch(/\/licence-manifest/);
  });
});
