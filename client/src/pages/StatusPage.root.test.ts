import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "StatusPage.tsx"), "utf8");

describe("/status reads /root.json, /api/xrpl state, publisher-health", () => {
  it("probes public-root fields and does not treat a dead gateway as the only instrument", () => {
    expect(page).toContain('fetch("/root.json")');
    expect(page).toContain('fetch("/api/xrpl")');
    expect(page).toContain('fetch("/publisher-health.json")');
    expect(page).toContain("as_of");
    expect(page).toContain("merkle_root");
    expect(page).toContain("card_count");
    expect(page).toContain("unsigned-leaf");
    expect(page).toContain("NO_LAPTOP_SIGN");
    expect(page).toContain("halt_on_split");
    expect(page).toContain("adapter");
    expect(page).not.toMatch(/stays 404/);
    expect(page).not.toMatch(/£/);
    expect(page).not.toMatch(/\$\d/);
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
