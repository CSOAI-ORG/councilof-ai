import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EvidenceFoundationsCourse from "./EvidenceFoundationsCourse";

describe("Evidence Foundations component", () => {
  it("renders the complete module without network or browser effects", () => {
    const html = renderToStaticMarkup(<EvidenceFoundationsCourse />);
    expect(html).toContain('data-testid="evidence-foundations-course"');
    expect(html).toContain("Evidence Foundations");
    expect(html).toContain("Council Learning");
    expect(html).toContain("Source identity");
    expect(html).toContain("Correction");
    expect(html).toContain("session-only progress");
    expect(html).toContain("not saved for a later visit");
    expect(html).toContain("Export practice note");
    expect(html).not.toContain("Laputa");
  });

  it("renders six lesson selectors and practice-only boundaries", () => {
    const html = renderToStaticMarkup(<EvidenceFoundationsCourse />);
    expect((html.match(/aria-current=/g) ?? []).length).toBe(1);
    for (const label of [
      "Source identity",
      "What a signature proves",
      "Missing evidence",
      "Material source change",
      "Escalation and abstention",
      "Corrections and maintenance",
    ]) expect(html).toContain(label);
    expect(html).toContain("practice only");
    expect(html).toContain("does not automatically send answers");
  });
});
