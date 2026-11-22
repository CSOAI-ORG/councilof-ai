/**
 * /api/assess: an identifier the fixed control list does not hold must be handed back to the
 * caller, never dropped. Found live on 22 Nov 2026: human_oversight, logging and
 * data_minimization in claimed_controls returned "0 of 7 claimed" with no sign that none
 * of the three had been recognised.
 */
import { describe, expect, it } from "vitest";
import { onRequestPost } from "./assess";

const post = async (body: unknown) => {
  const request = new Request("https://councilof.ai/api/assess", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const res = await (onRequestPost as unknown as (c: unknown) => Promise<Response>)({ request, env: {} });
  return (await res.json()) as Record<string, any>;
};
const text = "EU deployed clinical AI triage tool that screens emergency department patient records.";

describe("/api/assess claimed_controls", () => {
  it("returns identifiers it does not recognise and counts none of them", async () => {
    const r = await post({ description: text, claimed_controls: ["human_oversight", "logging", "data_minimization"] });
    expect(r.claimed_control_coverage.claimed).toBe(0);
    expect(r.unrecognised_claimed_controls).toEqual(["human_oversight", "logging", "data_minimization"]);
    expect(r.explanation).toMatch(/3 identifier\(s\) sent in claimed_controls are not on the fixed list/);
    expect(r.accepted_control_identifiers).toContain("art14_human_oversight");
  });

  it("counts an identifier on the fixed list and reports nothing unrecognised", async () => {
    const r = await post({ description: text, claimed_controls: ["art14_human_oversight", "art12_logging"] });
    expect(r.claimed_control_coverage.claimed).toBe(2);
    expect(r.unrecognised_claimed_controls).toEqual([]);
    expect(r.explanation).not.toMatch(/not on the fixed list/);
  });

  it("bounds what it echoes: 20 identifiers at most, 64 characters each", async () => {
    const r = await post({ description: text, claimed_controls: [...Array.from({ length: 30 }, (_, i) => "x" + i), "y".repeat(500)] });
    expect(r.unrecognised_claimed_controls.length).toBe(20);
    const long = await post({ description: text, claimed_controls: ["y".repeat(500)] });
    expect(long.unrecognised_claimed_controls[0].length).toBe(64);
  });

  it("the signed payload carries the unrecognised list", async () => {
    const r = await post({ description: text, claimed_controls: ["logging"] });
    expect(JSON.parse(r.signed_payload).unrecognised_claimed_controls).toEqual(["logging"]);
  });
});
