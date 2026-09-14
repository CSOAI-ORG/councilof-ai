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

describe("footer clears the fixed workspace launcher", () => {
  it("reserves at least the launcher's height plus its bottom offset", () => {
    const heightRem = Number(launcher.match(/className="fixed [^"]*\bh-(\d+)\b/)?.[1]) / 4;
    const bottom = launcher.match(/bottom:\s*"([^"]+)"/)?.[1] ?? "";
    expect(heightRem).toBeGreaterThan(0);
    expect(rem(footerPaddingBottom())).toBeGreaterThanOrEqual(heightRem + rem(bottom));
  });

  it("adds the cookie banner's published height, with the same variable and fallback", () => {
    expect(footerPaddingBottom()).toMatch(/var\(--cookie-banner-h,\s*0px\)/);
    expect(launcher.match(/var\((--[a-z-]+),/)?.[1]).toBe("--cookie-banner-h");
  });
});
