import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import answers from "./answers.json";

describe("AEO answers", () => {
  it("ships twelve measurement explainers, not certification copy", () => {
    expect(answers).toHaveLength(12);
    const blob = JSON.stringify(answers);
    expect(blob).not.toMatch(/SOVOS|sov3|OWEM|DEFONEOS|14-axis/);
    expect(blob).not.toMatch(/Certified Organization/);
    expect(answers.every((a) => a.slug && a.title && a.body)).toBe(true);
  });
});

describe("CRA SBOM has no internal codenames", () => {
  it("public SBOM is brand-gate clean", () => {
    const sbom = readFileSync(resolve(__dirname, "../../../public/interop/sbom-councilof-ai.json"), "utf8");
    expect(sbom).not.toMatch(/SOVOS|sov3|OWEM|sovereign/i);
  });
});
