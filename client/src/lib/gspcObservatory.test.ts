import { describe, it, expect } from "vitest";
import { FRAMEWORK_LENSES, selectAxes, safeSource, freshness, parseOrganisationEvidence, projectTrust, type TrustEvent } from "./gspcObservatory";
const target = { subject: "fixture-system", capability: "read", context: "sandbox", revision: "r1" };
const now = Date.parse("2026-09-18T06:00:00Z");
const event: TrustEvent = { ...target, id: "fixture-1", direction: "human-to-system", outcome: "supported", observedAt: "2026-09-18T05:00:00Z", expiresAt: "2026-09-19T05:00:00Z", evidenceDigest: "a".repeat(64), independentReview: true };
describe("framework projections", () => {
  const axes = [{ axis: "care", status: "UNMEASURED" }, { axis: "reserve-attestation", status: "MEASURED" }];
  it("keeps source rows and statuses unchanged", () => expect(selectAxes(axes, "care")).toEqual([axes[0]]));
  it("never widens an unknown framework", () => expect(selectAxes(axes, "unrecognised")).toEqual([]));
  it("does not infer a missing axis or score", () => expect(selectAxes([], "nist-ai-rmf")).toEqual([]));
  it("search is case insensitive", () => expect(selectAxes(axes, "all", "CARE")).toEqual([axes[0]]));
  it("makes voluntary status explicit", () => expect(FRAMEWORK_LENSES.find(l => l.id === "nist-ai-rmf")?.kind).toBe("voluntary framework"));
});
describe("evidence and source admission", () => {
  it.each(["javascript:alert(1)", "//attacker.test/a", "http://x.test/", "https://u:p@x.test", "/\\attacker.test", " https://x.test"])("rejects unsafe links %s", u => expect(safeSource(u)).toBeNull());
  it("accepts ordinary internal and HTTPS links", () => { expect(safeSource("/charter")).toBe("/charter"); expect(safeSource("https://airc.nist.gov/")).toBe("https://airc.nist.gov/"); });
  it("rejects wrong schemas", () => expect(() => parseOrganisationEvidence("gpai-notice", {})).toThrow());
  it("preserves empty evidence", () => expect(parseOrganisationEvidence("gpai-notice", { schema: "csoai.gpai-signatory-notice-index/0.1", cards: [] })).toEqual([]));
  it("cannot upgrade a self claim to measurement", () => {
    const root = { schema: "csoai.gpai-signatory-notice-index/0.1", fetched_at: "2026-09-02T05:44:40Z", primary_source: { url: "https://example.org/" }, cards: [{ id: "f", provider: "Fixture", status: "MEASURED", appearance: "appears", path: "../../private.json" }] };
    const [r] = parseOrganisationEvidence("gpai-notice", root);
    expect(r.measured).toBe(false); expect(r.receipt).toBeNull(); expect(r.observedAt).toBe(root.fetched_at);
  });
  it("does not double count duplicate identities", () => expect(parseOrganisationEvidence("humanoid-deployment", { schema: "csoai.humanoid-registry-unsigned/0.1", rows: [{ id: "1", operator: "Fixture" }, { id: "1", operator: "Fixture" }] })).toHaveLength(1));
  it("distinguishes stale, future and missing timestamps", () => { expect(freshness("2026-09-01", now)).toBe("STALE"); expect(freshness(null, now)).toBe("UNKNOWN"); expect(freshness("2027-01-01", now)).toBe("FUTURE_DATE"); expect(freshness("2026-09-18T05:00:00Z", now)).toBe("CURRENT_WINDOW"); });
});
describe("task-scoped reciprocal marble projection", () => {
  it("has no invented initial trust", () => expect(projectTrust([], target, now).cups["human-to-system"].state).toBe("NO_ADMITTED_EVIDENCE"));
  it("adds a reviewed current support event without authorising actions", () => { const r = projectTrust([event], target, now); expect(r.cups["human-to-system"].supported).toBe(1); expect(r.authorisesAction).toBe(false); });
  it("deduplicates repeated evidence", () => expect(projectTrust([event, { ...event, id: "clone" }], target, now).cups["human-to-system"].supported).toBe(1));
  it.each([{ revision: "r2" }, { capability: "write" }, { context: "production" }, { subject: "another-system" }, { independentReview: false }, { evidenceDigest: "invalid" }, { observedAt: "2027-01-01" }, { expiresAt: "2026-09-17" }])("excludes mismatched or inadmissible evidence %o", change => expect(projectTrust([{ ...event, ...change }], target, now).cups["human-to-system"].supported).toBe(0));
  it("keeps contradictions rather than subtracting them into an opaque score", () => { const r = projectTrust([event, { ...event, id: "bad", outcome: "contradicted", evidenceDigest: "b".repeat(64) }], target, now); expect(r.cups["human-to-system"].supported).toBe(1); expect(r.cups["human-to-system"].contradicted).toBe(1); });
  it("does not age out a scoped revocation and regrant", () => expect(projectTrust([event, { ...event, id: "revoke", outcome: "revoked", expiresAt: "2026-09-17" }], target, now).cups["human-to-system"].state).toBe("REVOKED"));
  it("keeps the reciprocal directions separate", () => { const r = projectTrust([{ ...event, direction: "system-to-human" }], target, now); expect(r.cups["human-to-system"].supported).toBe(0); expect(r.cups["system-to-human"].supported).toBe(1); });
});
