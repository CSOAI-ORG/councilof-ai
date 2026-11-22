import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "AssessTool.tsx"), "utf8")
  .replace(/^\s*\/\*[\s\S]*?\*\//, "");

describe("live assessment enquiry does not promise unimplemented fulfillment", () => {
  it("does not claim a signed report or a personal reply was sent", () => {
    expect(page).not.toMatch(/we'll email your signed report|we'll be in touch personally/i);
    expect(page).toContain("No email was sent to the Council team");
    expect(page).toContain("no report or reply has been booked");
    expect(page).toContain("Email Council directly for a response");
  });

  it("offers direct email as a genuine handoff and names storage honestly", () => {
    expect(page).toContain("mailto:contact@csoai.org?subject=Measurement%20scope%20request");
    expect(page).toContain("Store enquiry (no email sent)");
    expect(page).toContain("acknowledgedLeadStorage(res.status, j)");
    expect(page).toContain("result_id: report?.result_id");
  });
});
