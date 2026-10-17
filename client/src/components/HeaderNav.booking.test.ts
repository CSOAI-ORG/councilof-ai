import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BOOK_MEASUREMENT_LINK, PRIMARY_LINKS } from "./HeaderNav";

const header = readFileSync(resolve(__dirname, "Header.tsx"), "utf8");

describe("header booking door (booking-blocker, 14 Oct 2026)", () => {
  it("points at the prerendered /assess/ pane that carries the ras-booking-cta", () => {
    expect(BOOK_MEASUREMENT_LINK.href).toBe("/assess/");
    expect(BOOK_MEASUREMENT_LINK.name).toBe("Book a measurement");
  });

  it("says measurement, never certify or attest, and prints no price", () => {
    expect(BOOK_MEASUREMENT_LINK.name).not.toMatch(/certif|attest|£|\$|€|\d/i);
  });

  it("renders on desktop and in the mobile menu", () => {
    expect(header).toContain('data-testid="header-book-measurement"');
    expect(header).toContain('data-testid="mobile-book-measurement"');
  });

  it("leaves PRIMARY_LINKS (and so the static-shell header) unchanged", () => {
    expect(PRIMARY_LINKS.map((l) => l.href)).not.toContain("/assess/");
  });
});
