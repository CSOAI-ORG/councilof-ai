import { describe, expect, it } from "vitest";
import { eventAt, parseObservatory, parseWorldFact, WORLD_SOURCES } from "./worldLens";

const archive = {
  schema: "csoai.simulation-observatory/1",
  source: { url: "https://councilof.ai/j-space/events.json", sha256: "a".repeat(64), generated_at: "2026-08-15T16:59:38Z", event_count: 1 },
  import: { event_count: 1, upstream_signature_verification: "not-performed" },
  events: [{ source_index: 0, axis: "governance", intent: "synthetic-assessment-EU", source_epoch: 1784977202.412 }],
};

describe("Council World fixed-source evidence adapters", () => {
  it("reads source-declared counts without claiming verification", () => {
    const board = parseWorldFact("gspc", { schema: "csoai.gspc-axes/0.5", totals: { axes: 34 }, measured_on: { date: "dated, not current" } });
    expect(board.value).toBe("34 published axes");
    expect(board.caveat).toContain("not a fresh run");
    const root = parseWorldFact("root", { card_count: 452, as_of: "2026-11-21T23:11:50Z" });
    expect(root.caveat).toContain("not independently verified");
    const worker = parseWorldFact("worker", { schema: "csoai.worker-state/0.1", status: "OFFLINE", diagnostic_code: "HEALTH_URL_NOT_CONFIGURED" });
    expect(worker.value).toBe("OFFLINE");
    expect(worker.caveat).toContain("HTTP 200");
    expect(WORLD_SOURCES.observatory).toBe("/world/observatory/index.json");
  });

  it("refuses missing schemas, fake counts and unknown statuses", () => {
    expect(() => parseWorldFact("gspc", { totals: { axes: 34 } })).toThrow();
    expect(() => parseWorldFact("gspc", { schema: "csoai.gspc-axes/0.5", totals: { axes: -1 } })).toThrow();
    expect(() => parseWorldFact("root", { card_count: "452", as_of: "today" })).toThrow();
    expect(() => parseWorldFact("root", { card_count: 452, as_of: "today" })).toThrow();
    expect(() => parseWorldFact("root", { card_count: 452, as_of: "2035-01-01" })).toThrow();
    expect(() => parseWorldFact("worker", { schema: "csoai.worker-state/0.1", status: "ALIVE" })).toThrow();
  });

  it("retains source time, archive signature limit and exact event index", () => {
    const result = parseObservatory(archive);
    expect(result.signatureVerification).toBe("not-performed");
    expect(result.sourceDate).toBe("2026-08-15T16:59:38Z");
    expect(eventAt(result, 0)?.axis).toBe("governance");
    expect(eventAt(result, 1)).toBeNull();
    expect(parseObservatory({ ...archive, events: [{ ...archive.events[0], intent: "" }] }).events[0].intent).toBe("");
    expect(eventAt(result, -1)).toBeNull();
    expect(parseWorldFact("observatory", archive).value).toBe("1 indexed events");
  });

  it("rejects fabricated archive totals, unverified signature assertions and corrupt rows", () => {
    expect(() => parseObservatory({ ...archive, source: { ...archive.source, event_count: 2 } })).toThrow();
    expect(() => parseObservatory({ ...archive, import: { ...archive.import, upstream_signature_verification: "verified" } })).toThrow();
    expect(() => parseObservatory({ ...archive, events: [{ ...archive.events[0], source_index: 1 }] })).toThrow();
    expect(() => parseObservatory({ ...archive, source: { ...archive.source, sha256: "not-a-hash" } })).toThrow();
    expect(() => parseObservatory({ ...archive, events: [{ ...archive.events[0], source_epoch: Number.NaN }] })).toThrow();
    expect(() => parseObservatory({ ...archive, events: [{ ...archive.events[0], intent: null }] })).toThrow();
  });
});
