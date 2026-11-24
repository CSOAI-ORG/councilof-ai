import { describe, expect, it } from "vitest";
import { parseCorrections, parseFabric, parseOversight } from "./worldSignals";

const correction = { schema: "csoai.corrections/0.1", signature_state: "VALID",
  corrections: [{ id: "C-2026-1120-03", date: "2026-11-20", published_at: "UNRECORDED",
    status: "CORRECTED", what_was_wrong: "Bad denominator", what_changed: "Disclosed correction" }] };
const fabric = { schema: "csoai.capability-fabric/0.1", observed_at: "2026-11-24T04:00:46.566Z",
  rails: [{ id: "mcp-tools", label: "MCP tools", role: "Read only discovery", state: "RUNTIME_OBSERVED",
    endpoint: "/mcp", observed_at: "2026-11-24T04:00:46.566Z", summary: "Found 54 declared tools", writes_board: false }] };
const oversight = { schema: "csoai.hitl-companion-state/0.1", decision_path: "open", store_bound: true,
  assessment_scope: { operator_identity: "NOT_VERIFIED", human_presence: "NOT_ESTABLISHED",
    professional_competence: "NOT_ASSESSED", execution_authority: false },
  review_queue_summary: { PENDING: 3, APPROVED: 2 } };

describe("World Signals source-only read projection", () => {
  it("shows corrections as source-reported, preserving unknown publication", () => {
    const result = parseCorrections(correction);
    expect(result.signatureClaim).toBe("VALID");
    expect(result.items[0].publishedAt).toBeNull();
    expect(result.items[0].evidenceState).toBe("SOURCE_REPORTED");
    expect(result.items[0].geo).toBeNull();
    expect(() => parseCorrections({ ...correction, corrections: [correction.corrections[0], correction.corrections[0]] })).toThrow();
  });
  it("does not accept unsafe source paths, imagined board writes or fabricated states", () => {
    expect(parseFabric(fabric).rails[0].destination).toBe("/mcp");
    expect(parseFabric({ ...fabric, rails: [{ ...fabric.rails[0], endpoint: "//external.bad/path" }] }).rails[0].destination).toBeNull();
    expect(parseFabric({ ...fabric, rails: [{ ...fabric.rails[0], endpoint: "javascript:alert(1)" }] }).rails[0].destination).toBeNull();
    expect(() => parseFabric({ ...fabric, rails: [{ ...fabric.rails[0], writes_board: true }] })).toThrow();
    expect(() => parseFabric({ ...fabric, rails: [{ ...fabric.rails[0], state: "EXECUTED" }] })).toThrow();
  });
  it("distinguishes configured decision recording from verified human authority", () => {
    const result = parseOversight(oversight);
    expect(result.decisionPath).toBe("open");
    expect(result.pending).toBe(3);
    expect(result.humanPresence).toBe("NOT_ESTABLISHED");
    expect(result.executionAuthority).toBe(false);
    expect(() => parseOversight({ ...oversight, assessment_scope: { ...oversight.assessment_scope, execution_authority: true } })).toThrow();
  });
  it("rejects missing source schema and invalid correction dates", () => {
    expect(() => parseCorrections({ ...correction, schema: "untrusted" })).toThrow();
    expect(() => parseCorrections({ ...correction, corrections: [{ ...correction.corrections[0], date: "tomorrow" }] })).toThrow();
    expect(() => parseFabric({ ...fabric, observed_at: "now" })).toThrow();
    expect(() => parseOversight({ ...oversight, review_queue_summary: null })).toThrow();
  });
});
