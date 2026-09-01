import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const files = ["Products.tsx", "CouncilLicensingLanding.tsx", "legal/LicensingAgreement.tsx"].map(
  (f) => readFileSync(join(dir, f), "utf8"),
);
const blob = files.join("\n");

describe("new product surfaces", () => {
  it("do not add a preference-arena or router product", () => {
    expect(blob).not.toMatch(/Bradley-Terry votes/);
    expect(blob).not.toMatch(/LLM-as-judge/);
    expect(blob).not.toMatch(/route by cost, latency, fallbacks/i);
  });
});
