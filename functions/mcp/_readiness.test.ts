/**
 * framework_readiness — the deterministic checklist tool (2026-11-02, lane csoai-frontend-consol).
 *
 * The invariants that matter here, beyond the fleet-wide gates (tool-annotations, fleet lock,
 * doctrine lint) that already hold this definition:
 *   1. DETERMINISM — the same arguments always produce the same structured content. The tool
 *      fetches nothing and reads no clock, so a caller can cache and quote an answer.
 *   2. NO STATUS WORD — the output never states the caller's state: no score, no pass/fail, and
 *      not_a_certification: true on every payload, including the error path.
 *   3. EVERY ITEM CARRIES BOTH HALVES — an evidence suggestion AND an open question, so a checklist
 *      item can never read as an instruction that a machine could complete on its own.
 */
import { describe, expect, it } from "vitest";
import { READINESS_TOOL_NAMES, readinessResult, readinessToolResult } from "./_readiness";

const FRAMEWORK_IDS = ["eu-ai-act", "dora", "nis2", "gdpr", "iso-27001", "nist-csf", "soc2", "pci-dss", "cra"];

describe("framework_readiness", () => {
  it("the fleet gate names are exactly the nine frameworks' one tool", () => {
    expect([...READINESS_TOOL_NAMES]).toEqual(["framework_readiness"]);
  });

  it("every declared framework returns OK with both halves on every item", () => {
    for (const fw of FRAMEWORK_IDS) {
      const r = readinessResult({ framework: fw });
      expect(r.state).toBe("OK");
      const p = r.payload as Record<string, unknown>;
      expect(p.not_a_certification).toBe(true);
      expect(p.not_legal_advice).toBe(true);
      const items = p.items as Array<Record<string, unknown>>;
      expect(items.length).toBeGreaterThanOrEqual(6);
      for (const item of items) {
        expect(String(item.provision)).toBeTruthy();
        expect(String(item.evidence_suggested)).toBeTruthy();
        expect(String(item.opens_question)).toBeTruthy();
        expect(item.opens_question).not.toEqual(item.evidence_suggested);
      }
      expect((p.provenance as string[]).every((s) => s.startsWith("http"))).toBe(true);
    }
  });

  it("is deterministic: the same arguments give byte-identical structured content", () => {
    const a = JSON.stringify(readinessResult({ framework: "gdpr", sector: "healthcare" }).payload);
    const b = JSON.stringify(readinessResult({ framework: "gdpr", sector: "healthcare" }).payload);
    expect(a).toBe(b);
    expect(a).not.toContain("2026-"); // no clock in the payload
  });

  it("an unknown framework is BAD_ARGUMENTS naming the enum, still not_a_certification", async () => {
    const r = await readinessToolResult({ framework: "hipaa" });
    expect(r.isError).toBe(true);
    const sc = r.structuredContent as Record<string, unknown>;
    expect(sc.state).toBe("BAD_ARGUMENTS");
    expect(sc.not_a_certification).toBe(true);
    expect(String(r.content[0].text)).toContain('"cra"');
  });

  it("a known sector gets the pointer note, an unknown one is said, not invented", async () => {
    const hit = await readinessToolResult({ framework: "pci-dss", sector: "finance" });
    const text = hit.content[0].text;
    expect(text).toContain('For sector "finance"');
    const miss = await readinessToolResult({ framework: "gdpr", sector: "floristry" });
    expect(miss.content[0].text).toContain('No sector hint is held for "floristry"');
  });

  it("the header sentence and every item refuse the status reading", async () => {
    const r = await readinessToolResult({ framework: "eu-ai-act" });
    const text = r.content[0].text;
    expect(text).toContain("does not certify compliance");
    expect(text).toContain("never a determination");
  });
});
