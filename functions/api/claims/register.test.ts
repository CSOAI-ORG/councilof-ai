import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { onRequestGet } from "./register";
import register from "../../../public/spec/claim-maintenance/register.json";

const ROOT = resolve(__dirname, "../../..");
const get = (url: string) =>
  (onRequestGet as unknown as (c: { request: Request }) => Promise<Response>)({
    request: new Request(url),
  });

describe("GET /api/claims/register", () => {
  it("serves the committed register bytes — it does not compute a second copy", async () => {
    const res = await get("https://councilof.ai/api/claims/register");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(register);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(res.headers.get("link")).toContain("/spec/claim-maintenance/v0.2/");
    expect(res.headers.get("x-claim-maintenance-spec")).toBe("https://councilof.ai/spec/claim-maintenance/v0.2/");
  });

  it("counts what is on disk, not what we wish existed", () => {
    // The register is generated from public/claims/*.json. Read the same LIVE registries here and
    // compare, so a hand-edited register fails rather than quietly overstating the population (7.5).
    const liveFiles = register.registries.filter((r) => r.status === "LIVE");
    let onDiskClaims = 0;
    const onDiskSubjects = new Set<string>();
    for (const r of liveFiles) {
      const doc = JSON.parse(readFileSync(resolve(ROOT, "public/claims", r.url.split("/").pop()!), "utf8"));
      if (doc.subjects && !Array.isArray(doc.subjects)) {
        for (const [k, s] of Object.entries(doc.subjects as Record<string, { claims: unknown[] }>)) {
          onDiskSubjects.add(k);
          onDiskClaims += s.claims.length;
        }
      } else if (Array.isArray(doc.claims)) {
        for (const claim of doc.claims as Array<{ subject?: { identifier?: string; name?: string } }>) {
          onDiskSubjects.add(claim.subject?.identifier || claim.subject?.name || "unattributed");
          onDiskClaims += 1;
        }
      } else {
        throw new Error(`registry ${r.registry_id} has neither supported claim shape`);
      }
    }
    expect(register.totals.claims).toBe(onDiskClaims);
    expect(register.totals.subjects).toBe(onDiskSubjects.size);
    expect(register.subjects.reduce((n, s) => n + s.claim_count, 0)).toBe(register.totals.claims);
  });

  it("resolves supersession instead of double-counting it, and CHECKS the declared bytes", () => {
    // A revision leaves the prior registry on disk unedited, which is right and which is exactly
    // how a register comes to report a population nobody maintains. Superseded registries are
    // listed, excluded from the totals, and their declared sha256 is checked against the file.
    const superseded = register.registries.filter((r) => r.status === "SUPERSEDED");
    for (const r of superseded) {
      expect(r.superseded_by, `${r.registry_id} is SUPERSEDED by nothing`).toBeTruthy();
      expect(r.file_sha256).toMatch(/^[0-9a-f]{64}$/);
      // null means the revision declared no sha256; false means it declared one that is wrong.
      expect(r.supersession_sha256_matches, `${r.registry_id}: declared sha256 does not match the bytes on disk`).not.toBe(false);
      // Its subjects must not appear twice in the live rows.
      const rows = register.subjects.filter((s) => s.registry_id === r.registry_id);
      expect(rows).toHaveLength(0);
    }
    expect(register.totals.registries + register.totals.registries_superseded).toBe(
      register.totals.registry_files_on_disk,
    );
    // No subject is listed twice.
    const keys = register.subjects.map((s) => `${s.registry_id}::${s.subject_key}`);
    expect(new Set(keys).size).toBe(keys.length);
    const names = register.subjects.map((s) => s.subject);
    expect(new Set(names).size, "the same subject is listed more than once").toBe(names.length);
  });

  it("does not mistake a signed-run envelope for a registry", () => {
    for (const f of register.non_registry_files_in_claims_dir) {
      expect(f.schema).not.toMatch(/^csoai\.claim-registry\//);
    }
    expect(register.totals.registries).toBeLessThanOrEqual(register.totals.registry_files_on_disk);
  });

  it("carries an as_of, and every state count sums to the claim count", () => {
    // A full instant, not a date: two registers built the same day must be distinguishable.
    expect(register.as_of).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(register.as_of).not.toMatch(/T00:00:00Z$/);
    const summed = Object.values(register.totals.by_state).reduce((a, b) => a + b, 0);
    const unknown = register.subjects.reduce((n, s) => n + s.claims_without_a_specification_state, 0);
    expect(summed + unknown).toBe(register.totals.claims);
  });

  it("never ASSERTS anchoring — a receipt is submitted until its upgrade is verified (spec 8.1)", () => {
    for (const s of register.subjects) {
      if (s.timestamp_receipt) expect(s.timestamp_state).toBe("RECEIPT_PRESENT_UPGRADE_UNVERIFIED");
      expect(JSON.stringify(s)).not.toMatch(/anchor/i);
    }
    // The word may appear in exactly two places: a does_not_prove disclaimer, and a quotation of
    // a source registry's own wording carried in a *_verbatim field with a disclosure beside it.
    // Anywhere else it would be this register asserting a confirmation nobody has run.
    for (const r of register.registries) {
      if (/anchor/i.test(String(r.signature_state_verbatim ?? ""))) {
        const d = register.disclosures.find((x) => x.registry_id === r.registry_id);
        expect(d, `registry ${r.registry_id} quotes "anchored" with no disclosure beside it`).toBeTruthy();
        expect(d!.disclosure).toMatch(/SUBMITTED until its upgrade/);
      }
      // "signed" is derived from bytes, never from a prose field: a sidecar counts only when the
      // digest it pins is the digest the file actually has.
      if (r.signature_binding === "sidecar") {
        expect(r.signed).toBe(r.sidecar_pin_verified);
        expect(r.signature_sidecar_url).toContain("/claims/");
      } else if (r.signature_binding === "none") {
        expect(r.signed).toBe(false);
      }
    }
    // Every quoted signature_state is disclosed, live or superseded, because the register prints it.
    for (const d of register.disclosures) expect(["LIVE", "SUPERSEDED"]).toContain(d.registry_status);
    expect(register.does_not_prove.join(" ")).toMatch(/receipt is anchored in a block/);
  });

  it("records an absent read schedule as absent rather than inventing one", () => {
    for (const s of register.subjects) {
      if (s.next_scheduled_read_state === "UNSCHEDULED") expect(s.next_scheduled_read).toBeNull();
      else expect(s.next_scheduled_read).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("says plainly what it is not, and alleges nothing about anyone", () => {
    const text = JSON.stringify(register).toLowerCase();
    for (const s of [
      "not fact-checking",
      "not certification",
      "not auditing",
      "not reputation scoring",
      "not adversarial journalism",
    ]) {
      expect(text).toContain(s);
    }
    expect(register.non_allegation).toMatch(/not an endorsement and it is not an accusation/);
    expect(register.does_not_prove.length).toBeGreaterThan(0);
    // No verdict vocabulary anywhere in the served bytes.
    expect(JSON.stringify(register.subjects)).not.toMatch(
      /\b(misleading|deceptive|fraud|dishonest|exaggerat|overstat|debunk)/i,
    );
  });

  it("filters by subject and by state, and labels the view as partial", async () => {
    const first = register.subjects[0];
    const res = await get(`https://councilof.ai/api/claims/register?subject=${encodeURIComponent(first.subject)}`);
    const body = await res.json();
    expect(body.subjects).toHaveLength(1);
    expect(body.subjects[0].subject).toBe(first.subject);
    expect(body.view.subjects_in_register).toBe(register.subjects.length);
    expect(body.totals.subjects).toBe(register.totals.subjects);

    const byState = await get("https://councilof.ai/api/claims/register?state=CLAIM_CAPTURED");
    const stateBody = await byState.json();
    expect(stateBody.subjects.every((s: { states: Record<string, number> }) => s.states.CLAIM_CAPTURED > 0)).toBe(true);
  });

  it("answers an unknown state with the four that exist, never with an empty list", async () => {
    const res = await get("https://councilof.ai/api/claims/register?state=CLAIM_DISPUTED");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.states).toEqual(["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"]);
  });
});
