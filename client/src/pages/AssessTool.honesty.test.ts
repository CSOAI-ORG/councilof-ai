import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "AssessTool.tsx"), "utf8");

describe("/assess aligns to /measure — paid, booking not live, Coming — Paddle", () => {
  it("does not claim a free signed run", () => {
    expect(page).not.toContain("Free. No account. The card is yours.");
    expect(page).not.toContain("Run signed measurement");
    expect(page).toContain("Paid measurement");
    expect(page).toContain("Booking is not live");
    expect(page).toContain("Coming — Paddle");
    expect(page).toContain("public verifies free");
    expect(page).toContain("Never a bought rank");
    expect(page).toContain('disabled={true}');
    expect(page).not.toContain("$199");
    expect(page).not.toMatch(/Paddle\.Checkout|paddle-js|pw-price/i);
  });
});
