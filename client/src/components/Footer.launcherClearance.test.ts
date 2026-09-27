import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const here = resolve(__dirname);
const footer = readFileSync(resolve(here, "Footer.tsx"), "utf8");
const launcher = readFileSync(resolve(here, "lobby/CouncilLobby.tsx"), "utf8");

/** Read the attribute itself, never the file: a comment must not satisfy this. */
function footerPaddingBottom(): string {
  const tag = footer.match(/<footer\b[\s\S]*?\n\s*>/)?.[0] ?? "";
  const m = tag.match(/paddingBottom:\s*"([^"]+)"/);
  if (!m) throw new Error("Expected an explicit paddingBottom on the <footer> root");
  return m[1];
}

function rem(expr: string): number {
  const m = expr.match(/([\d.]+)rem/);
  if (!m) throw new Error(`Expected a rem term in ${expr}`);
  return Number(m[1]);
}

describe("footer clears the cookie banner, and no launcher any more", () => {
  it("reserves only a small gap now that no fixed launcher exists", () => {
    // 27 Sep 2026 (ux-unify): CouncilLobby renders no fixed pill, so the 4.25rem
    // launcher footprint is no longer reserved under the footer's last line.
    expect(launcher).not.toMatch(/className="fixed /);
    expect(rem(footerPaddingBottom())).toBeLessThanOrEqual(1.5);
    expect(rem(footerPaddingBottom())).toBeGreaterThan(0);
  });

  it("adds the cookie banner's published height, with the same variable and fallback", () => {
    expect(footerPaddingBottom()).toMatch(/var\(--cookie-banner-h,\s*0px\)/);
  });
});
