import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "StatusPage.tsx"), "utf8");

describe("/status reads /root.json and keeps /api/xrpl 404", () => {
  it("probes public-root fields and the xrpl 404", () => {
    expect(page).toContain('fetch("/root.json")');
    expect(page).toContain('fetch("/api/xrpl")');
    expect(page).toContain("as_of");
    expect(page).toContain("merkle_root");
    expect(page).toContain("card_count");
    expect(page).toContain("NO_LAPTOP_SIGN");
    expect(page).toMatch(/stays 404/);
  });
});
