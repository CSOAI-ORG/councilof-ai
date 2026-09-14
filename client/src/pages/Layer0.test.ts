import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "Layer0.tsx"), "utf8");

describe("/layer0 — the floor reads itself", () => {
  it("renders the latest liveness atom and the rooted count from their producers, never from typed numbers", () => {
    expect(page).toContain('const LIVENESS_ATOM = "/interop/layer0-liveness-2026-09/card-layer0-liveness-unsigned.json"');
    expect(page).toContain('const ROOT_KINDS = "/interop/root-kinds.json"');
    expect(page).toContain('const LIVENESS_KIND = "csoai.layer0.liveness/0.1"');
    expect(page).toContain("<LiveFloor />");
    expect(page).toContain("A read, not a rating");
  });

  it("says PROBED, never a verdict, and keeps the 33-seat council a design", () => {
    expect(page).not.toMatch(/\b(certif|compliant|approved|guarantee)\w*/i);
    expect(page).not.toMatch(/(?<!UN)MEASURED\b/);
    expect(page).toMatch(/33-seat council (remains|is) a design/);
  });
});
