import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const persona = readFileSync(resolve(__dirname, "PersonaRouter.tsx"), "utf8");
const proof = readFileSync(resolve(__dirname, "../components/AxisProof.tsx"), "utf8");
const evidence = readFileSync(resolve(__dirname, "../components/PersonaEvidence.tsx"), "utf8");

describe("persona pages pass the live board props the components actually read", () => {
  it("AxisProof destructures axes, matching IndustryTemplate and /for/*", () => {
    expect(proof).toMatch(/function AxisProof\(\{ axes,/);
    expect(proof).toContain("(axes ?? []).map");
    expect(persona).toContain("<AxisProof axes={p.axes}");
    expect(persona).not.toContain("<AxisProof axis={p.axes}");
  });

  it("PersonaEvidence receives axes, not a silently dropped axis alias", () => {
    expect(evidence).toMatch(/export default function PersonaEvidence\(\{/);
    expect(evidence).toContain("axes,");
    expect(persona).toContain("axes={p.evidence.axes}");
    expect(persona).not.toContain("axis={p.evidence.axes}");
  });

  it("declares every public demographic", () => {
    expect(persona).toContain("regulator:");
    expect(persona).toContain("enterprise:");
    expect(persona).toContain("finance:");
    expect(persona).toContain("healthcare:");
    expect(persona).toContain("startup:");
    expect(persona).toContain('"sec-filer":');
  });
});
