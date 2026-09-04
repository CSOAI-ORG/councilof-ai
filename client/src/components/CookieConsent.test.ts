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

describe("cookie consent and the global workspace launcher", () => {
  it("keeps the launcher usable while the consent notice is visible", () => {
    expect(layer(consent)).toBeLessThan(layer(launcher));
    expect(consent).toContain("pr-16");
    expect(consent).toContain('aria-label="Cookie consent"');
  });

  it("keeps both consent choices and the policy link visible", () => {
    expect(consent).toContain("Essential only");
    expect(consent).toContain("Accept analytics");
    expect(consent).toContain('href="/cookie-policy"');
  });
});
