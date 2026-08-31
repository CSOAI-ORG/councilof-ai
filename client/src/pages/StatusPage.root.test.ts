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

  it("states 3KB vs ML-DSA-65 and #board-pqc-1 ABSENT", () => {
    expect(page).toContain("pqc-honesty");
    expect(page).toContain("3KB atom is binding");
    expect(page).toContain("~3.3KB");
    expect(page).toContain("#board-pqc-1");
    expect(page).toContain("ABSENT");
    expect(page).toContain("tsa.status: err");
    expect(page).toContain("csoai/gspc-asi");
  });
});
