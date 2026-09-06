import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const here = resolve(__dirname);
const consent = readFileSync(resolve(here, "CookieConsent.tsx"), "utf8");
const launcher = readFileSync(
  resolve(here, "lobby/CouncilLobby.tsx"),
  "utf8",
);

function layer(source: string): number {
  const match = source.match(/z-\[(\d+)\]/);
  if (!match) throw new Error("Expected an explicit z-index layer");
  return Number(match[1]);
}

/**
 * The className of the fixed-position root — NOT the whole file.
 *
 * The previous version of this file asserted `consent.toContain("pr-16")`
 * against the entire source. When the padding reservation was removed on
 * 2026-09-06 the assertion kept passing, because the words "pr-16" survived in
 * a COMMENT explaining why it went. A check that a comment can satisfy is not a
 * check. Everything here reads the attribute it is actually about.
 */
function fixedClass(source: string): string {
  const m = source.match(/className="(fixed [^"]*)"/);
  if (!m) throw new Error("Expected a fixed-position className");
  return m[1];
}

describe("cookie consent and the global workspace launcher", () => {
  it("keeps the launcher above the notice in paint order", () => {
    expect(layer(consent)).toBeLessThan(layer(launcher));
    expect(consent).toContain('aria-label="Cookie consent"');
  });

  it("does not pin the launcher to a fixed bottom edge any more", () => {
    // Measured /products at 1280x800 on 2026-09-06: `bottom-5` put the 158.34px
    // pill 19.5px into the banner and over 98.34px of "Accept analytics".
    expect(fixedClass(launcher)).not.toMatch(/\bbottom-\d/);
    expect(fixedClass(launcher)).toContain("fixed");
  });

  it("lifts the launcher by the banner's own published height", () => {
    expect(launcher).toContain("var(--cookie-banner-h");
    // and falls back to flush-bottom when there is no banner
    expect(launcher).toMatch(/var\(--cookie-banner-h,\s*0px\)/);
  });

  it("agrees on the variable name across BOTH files", () => {
    // The one failure this pairing has: rename it on one side and the lift
    // silently stops working, with no error anywhere.
    const declared = consent.match(/BANNER_H_VAR\s*=\s*"([^"]+)"/)?.[1];
    const consumed = launcher.match(/var\((--[a-z-]+),/)?.[1];
    expect(declared).toBe("--cookie-banner-h");
    expect(consumed).toBe(declared);
  });

  it("measures the banner instead of typing its height", () => {
    expect(consent).toContain("offsetHeight");
    expect(consent).toContain("ResizeObserver"); // it wraps to two rows when narrow
    // a typed pixel height would re-break the moment the banner wraps
    expect(consent).not.toMatch(/BANNER_H_VAR[^\n]*=\s*"\d+px"/);
  });

  it("clears the offset when the notice is dismissed", () => {
    expect(consent).toMatch(/publishHeight\(0\)/);
  });

  it("keeps both consent choices and the policy link visible", () => {
    expect(consent).toContain("Essential only");
    expect(consent).toContain("Accept analytics");
    expect(consent).toContain('href="/cookie-policy"');
  });
});
