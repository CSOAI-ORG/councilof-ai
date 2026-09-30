// The §10 disclosure guard for commissioned measurement (DRAFT — HELD for the owner's terms).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { checkCommission, KINDS } from "./commissionGuard.mjs";

const SCHEMA = JSON.parse(readFileSync(new URL("./commission-kinds-v0.1.schema.json", import.meta.url), "utf8"));

const good = () => ({
  schema: "csoai.commission/0.1",
  kind: "reproduction_on_request",
  commissioned_by: { name: "Example Underwriting Ltd", relationship_to_subject: "THIRD_PARTY_NO_RELATIONSHIP" },
  subject: { name: "Example Model Co", identifier: "example-model-v1" },
  payment: { rail: "gbp_invoice", basis: "per_delivered_work", contingent_on_content: false, reference: "CSOAI-C-0001" },
  conflicts: ["Commissioned and paid for by Example Underwriting Ltd. The result was not known when the work was agreed."],
  deliverable: "One published result re-run from its own inputs, with every read hashed and the outcome recorded as found.",
  states: ["REPRODUCED", "NOT_REPRODUCED", "UNMEASURED"],
  disclosure: { commission_visible_on_artifact: true, spec: "https://councilof.ai/spec/claim-maintenance/v0.2/#10" },
  never: ["a grade, score, rank or certificate", "a result agreed in advance", "a removal"],
});

describe("commissioned measurement — schema draft", () => {
  it("is HELD, names the four kinds, and requires commissioned_by and conflicts", () => {
    expect(SCHEMA.status).toBe("HELD_FOR_OWNER_TERMS");
    expect(SCHEMA.properties.kind.enum).toEqual(KINDS);
    for (const k of ["commissioned_by", "conflicts", "payment", "disclosure", "never"]) expect(SCHEMA.required).toContain(k);
    expect(SCHEMA.properties.payment.properties.contingent_on_content.const).toBe(false);
    expect(SCHEMA.properties.payment.properties.basis.const).toBe("per_delivered_work");
    // no price field anywhere in the schema
    expect(JSON.stringify(SCHEMA.properties.payment.properties)).not.toMatch(/"(amount|price|fee)"/);
    expect(SCHEMA.$id).not.toMatch(/^https:\/\/councilof\.ai\//); // a draft never claims a live URL
  });
});

describe("§10 disclosure guard", () => {
  it("a complete third-party commission passes", () => {
    expect(checkCommission(good())).toEqual([]);
  });

  it("§10.3: the payer must be named on the artifact, in conflicts[], as a commission", () => {
    const r = good(); r.commissioned_by.name = "";
    expect(checkCommission(r).join("\n")).toMatch(/commissioned_by\.name is required/);
    const r2 = good(); r2.conflicts = ["No relationship."];
    expect(checkCommission(r2).join("\n")).toMatch(/must name the commission itself/);
    const r3 = good(); r3.conflicts = [];
    expect(checkCommission(r3).join("\n")).toMatch(/conflicts\[\] is required/);
    const r4 = good(); r4.disclosure.commission_visible_on_artifact = false;
    expect(checkCommission(r4).join("\n")).toMatch(/policy page is not a disclosure/);
  });

  it("§10.3: a payer with a relationship to the subject must name it in conflicts[]", () => {
    const r = good();
    r.commissioned_by = { name: "Example Underwriting Ltd", relationship_to_subject: "THIRD_PARTY_WITH_RELATIONSHIP", relationship: "insurer of the subject" };
    expect(checkCommission(r).join("\n")).toMatch(/relationship to the subject must appear in conflicts/);
    r.conflicts.push("Example Underwriting Ltd is the insurer of the subject.");
    expect(checkCommission(r)).toEqual([]);
  });

  it("owner gate: self-commissioning is refused until a ruling is on the record", () => {
    const r = good();
    r.commissioned_by = { name: "Example Model Co", relationship_to_subject: "IS_SUBJECT" };
    r.conflicts = ["Commissioned and paid for by Example Model Co, the subject of this record."];
    expect(checkCommission(r).join("\n")).toMatch(/self-commissioning .* HELD until the owner rules/);
    r.owner_ruling = { ruled_at: "2026-10-01T00:00:00Z", ruling: "placeholder for the owner's words" };
    expect(checkCommission(r)).toEqual([]);
  });

  it("§10.2: never contingent on content, per delivered work, and no amount on the record", () => {
    const r = good(); r.payment.contingent_on_content = true;
    expect(checkCommission(r).join("\n")).toMatch(/contingent_on_content must be false/);
    const r2 = good(); r2.payment.basis = "subscription";
    expect(checkCommission(r2).join("\n")).toMatch(/per_delivered_work/);
    const r3 = good(); r3.payment.amount_gbp = 900;
    expect(checkCommission(r3).join("\n")).toMatch(/no public price/);
    const r4 = good(); r4.deliverable = "One re-run, invoiced at £900 per delivered result, outcome recorded as found.";
    expect(checkCommission(r4).join("\n")).toMatch(/carries an amount/);
  });

  it("§10.1 and never-a-grade: no verdict about the subject, nothing sold as a score", () => {
    const r = good(); r.deliverable = "A re-run showing the vendor's claim was misleading, with every read hashed.";
    expect(checkCommission(r).join("\n")).toMatch(/§10\.1/);
    const r2 = good(); r2.deliverable = "A safety score for the subject, re-run from its own published inputs.";
    expect(checkCommission(r2).join("\n")).toMatch(/never a grade/);
    const r3 = good(); r3.never = [];
    expect(checkCommission(r3).join("\n")).toMatch(/never\[\] must include/);
  });
});
