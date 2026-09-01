import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PLAYBOOK_CLAIMS, PLAYBOOK_PITCH, PLAYBOOK_RULING, playbookByVerdict } from "./playbookAudit";
import { CENSUS_SITES, EMPTY_SLOT_RULING, EMPTY_SLOTS } from "./emptySlots";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");

describe("domination playbook audit", () => {
  it("keeps demand and empty-slot names, refuses week-to-MEASURED", () => {
    expect(PLAYBOOK_RULING).toMatch(/Refuse/);
    expect(PLAYBOOK_PITCH).toMatch(/AILuminate for chat/);
    expect(playbookByVerdict("keep").some((c) => c.id === "eu-demand")).toBe(true);
    expect(playbookByVerdict("keep").some((c) => c.id === "empty-names")).toBe(true);
    expect(playbookByVerdict("keep").some((c) => c.id === "ailuminate-bind")).toBe(true);
    expect(playbookByVerdict("forbidden").some((c) => c.id === "forbid-week-fill")).toBe(true);
    expect(playbookByVerdict("forbidden").some((c) => c.id === "forbid-auto-email")).toBe(true);
    expect(playbookByVerdict("forbidden").some((c) => c.id === "forbid-tokens")).toBe(true);
    expect(playbookByVerdict("forbidden").some((c) => c.id === "forbid-seat-prices")).toBe(true);
    expect(EMPTY_SLOTS).toHaveLength(7);
    expect(EMPTY_SLOTS.map((s) => s.axis)).toEqual([
      "reserve-attestation",
      "regulatory-framework",
      "distribution-integrity",
      "custody-disclosure",
      "ai-economy-index",
      "human-labour-index",
      "humanoid-labour-index",
    ]);
    expect(EMPTY_SLOT_RULING).toMatch(/UNMEASURED until a signed cell/);
    expect(CENSUS_SITES.some((s) => s.id === "huggingface" && s.status === "planted")).toBe(true);
  });

  it("does not publish seat prices or a sold rank", () => {
    const blob = JSON.stringify({ PLAYBOOK_CLAIMS, PLAYBOOK_PITCH, EMPTY_SLOTS, CENSUS_SITES });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(products).toContain("PlaybookAudit");
    expect(products).toContain("EmptySlots");
  });
});
