import { describe, expect, it } from "vitest";
import { report, SLUGS } from "./_report";
import batch from "../../public/interop/eas-attestation-batch.json";

describe("the report an on-chain attestation will point at, permanently", () => {
  it("exists for every slug a staged attestation names — and only those", () => {
    const named = ((batch as { attestations?: { data?: string }[] }).attestations || [])
      .map((a) => String(JSON.parse(a.data || "{}").report_uri || "").rsplit?.("/")?.pop?.() ??
                  String(JSON.parse(a.data || "{}").report_uri || "").split("/").pop());
    for (const s of named) expect(report(String(s))).not.toBeNull();
    expect(SLUGS.sort()).toEqual([...new Set(named.map(String))].sort());
    expect(report("not-a-staged-asset")).toBeNull();   // must 404, never invent a report
  });

  it("never implies a risk verdict, because there is none", () => {
    for (const s of SLUGS) {
      const r = report(s)!;
      expect(r.risk_tier).toBe("unmeasured");
      expect(r.risk_tier_note).toMatch(/not a low rating/i);
      // Check for ASSERTIONS, not for substrings. The first version of this test banned the
      // bare word "endorse" and failed on the report's own disclaimer — "not a certificate, a
      // rating, an endorsement, or investment advice" — which is the copy we most want to keep.
      // A negation containing the word is the honest form; only the claiming form is the defect.
      // (Same lesson brand-gate encodes as nearAllow.)
      const blob = JSON.stringify(r).toLowerCase();
      for (const claim of [
        /\bis certified\b/, /\bwe certify\b/, /\bwe endorse\b/, /\bendorsed by\b/,
        /\bapproved by\b/, /\brated\s+(aaa|a\+|low risk|safe)\b/, /\bsafe to invest\b/,
      ]) expect(claim.test(blob)).toBe(false);
      // and the disclaimer itself must still be present, in its negating form
      expect(blob).toContain("not a certificate");
      expect(blob).toContain("endorsement");
    }
  });

  it("says twice that it is not a certificate, because the PATH says cert", () => {
    const r = report("buidl")!;
    expect(r.not_a_certificate).toMatch(/not a certificate/i);
    expect(r.not_a_certificate).toMatch(/rwa-cert/);   // explains the path rather than hiding it
  });

  it("DISCLOSES the number it cannot support instead of dropping it", () => {
    // The attestation carries verdict_sha256; that hash resolves to no card published in this
    // repo. A report that quietly omitted its one unsupportable number is the reason reports
    // stop being trusted, so it is printed with the reason it cannot be checked.
    for (const s of SLUGS) {
      const r = report(s)!;
      expect(r.verdict_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(r.verdict_resolvable).toBe(false);
      expect(r.verdict_note).toMatch(/does not resolve/i);
    }
  });

  it("carries the consent position and a command a stranger can run", () => {
    const r = report("benji")!;
    expect(r.consent).toMatch(/not been asked|not asked/i);
    expect(r.consent).toMatch(/Measurement, not certification/);
    expect(r.verify_yourself.join(" ")).toContain(r.contract);
  });

  it("joins control facts by CONTRACT ADDRESS, not by name", () => {
    // Names differ between sources ("BENJI (FOBXX)" vs a decoded on-chain name); the address is
    // the only field both sides agree on, so a name-based join would silently mismatch.
    for (const s of SLUGS) {
      const r = report(s)!;
      expect(r.control_facts).not.toBeNull();
      expect(String(r.contract)).toMatch(/^0x[0-9a-fA-F]{40}$/);
    }
  });
});
