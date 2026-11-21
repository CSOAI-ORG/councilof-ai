import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The Ask launcher and the cookie notice are both fixed to the bottom edge. On 17 Nov 2026 at
 * 390 px the launcher covered the notice's "Accept analytics" button on / and with the menu open.
 * The notice already publishes its measured height for exactly this (see CookieConsent.test.ts,
 * "cookie consent, with no floating launcher over it"); the launcher did not read it.
 *
 * These checks read the attribute and the constant the launcher renders with, never a comment.
 * Against master before this change all three fail: AskHost declared no LAUNCHER_BOTTOM.
 */
const here = resolve(__dirname);
const host = readFileSync(resolve(here, "AskHost.tsx"), "utf8");
const consent = readFileSync(resolve(here, "../CookieConsent.tsx"), "utf8");

function launcherBottom(): string {
  const m = host.match(/const LAUNCHER_BOTTOM\s*=\s*"([^"]+)"/);
  if (!m) throw new Error("Expected AskHost to declare LAUNCHER_BOTTOM");
  return m[1];
}

describe("the Ask launcher clears the cookie notice", () => {
  it("renders its bottom offset from LAUNCHER_BOTTOM, not a fixed bottom class", () => {
    expect(host).toMatch(/data-testid="ask-fab"\s*style=\{\{ bottom: LAUNCHER_BOTTOM \}\}/);
    expect(host).not.toMatch(/className="fixed bottom-\[/);
  });

  it("lifts by the height the notice publishes, under the name the notice declares", () => {
    const declared = consent.match(/BANNER_H_VAR\s*=\s*"([^"]+)"/)?.[1];
    expect(declared).toBe("--cookie-banner-h");
    expect(launcherBottom()).toContain(`var(${declared}, 0px)`);
  });

  it("keeps the safe-area inset and the 1rem gap it had", () => {
    expect(launcherBottom()).toMatch(/^calc\(1rem \+ env\(safe-area-inset-bottom, 0px\) \+ /);
  });
});
