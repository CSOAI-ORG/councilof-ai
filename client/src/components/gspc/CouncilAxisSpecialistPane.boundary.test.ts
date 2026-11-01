import { describe, expect, it } from "vitest";
import governance from "../../../../public/axis-specialists/governance.json";
import { validateAxisSpecialistAudit } from "./CouncilAxisSpecialistPane";
const audit = () => structuredClone(governance) as any;
describe("axis specialist display evidence boundary", () => {
  it("accepts the generated audit", () => expect(validateAxisSpecialistAudit(audit(), "governance").axis).toBe("governance"));
  it.each([
    ["contradictory passed count", (v: any) => { v.summary.passed += 1; }],
    ["fractional check total", (v: any) => { v.summary.checks = 1.5; }],
    ["negative findings", (v: any) => { v.summary.findings = -1; }],
    ["unknown check state", (v: any) => { v.checks[0].state = "VERIFIED"; }],
    ["null check", (v: any) => { v.checks[0] = null; }],
    ["duplicate check identity", (v: any) => { v.checks[1].id = v.checks[0].id; }],
    ["unearned executed control", (v: any) => { v.negative_controls[0].state = "PASS"; }],
    ["malformed row digest", (v: any) => { v.source.axis_row_sha256 = "not-a-digest"; }],
    ["invented summary state", (v: any) => { v.summary.audit_state = "APPROVED"; }],
    ["invalid detail", (v: any) => { v.checks[0].detail = {trusted:true}; }]
  ])("refuses %s before rendering", (_name, change) => {
    const value=audit(); (change as (v:any)=>void)(value);
    expect(()=>validateAxisSpecialistAudit(value,"governance")).toThrow("Unsafe or mismatched");
  });
});
