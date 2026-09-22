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
    expect(res.headers.get("link")).toContain("/spec/claim-maintenance/v0.1/");
  });

  it("counts what is on disk, not what we wish existed", () => {
    // The register is generated from public/claims/*.json. Read the same files here and compare,
    // so a hand-edited register fails rather than quietly overstating the population (spec 7.5).
    const registries = readFileSync(
      resolve(ROOT, "public/claims", register.registries[0].url.split("/").pop()!),
      "utf8",
    );
    const doc = JSON.parse(registries);
    const onDisk = Object.values(doc.subjects as Record<string, { claims: unknown[] }>).reduce(
      (n, s) => n + s.claims.length,
      0,
    );
    expect(register.totals.claims).toBe(onDisk);
    expect(register.totals.subjects).toBe(Object.keys(doc.subjects).length);
    expect(register.subjects.reduce((n, s) => n + s.claim_count, 0)).toBe(register.totals.claims);
  });

  it("carries an as_of, and every state count sums to the claim count", () => {
    expect(register.as_of).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
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
      expect(r.signed).toBe(false);
    }
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
