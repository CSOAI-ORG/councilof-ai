import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ReactionResearchReview from "./ReactionResearchReview";

describe("CouncilOS reaction research integration", () => {
  it("renders a collapsed opt-in source-bound local review without a form", () => {
    const html = renderToStaticMarkup(<ReactionResearchReview />);
    expect(html).toContain('data-testid="reaction-research-review"');
    expect(html).toContain("<details");
    expect(html).not.toContain("<form");
    expect(html).toContain("Simulation never becomes");
    expect(html).toContain("No upload, storage, payment");
    expect(html).toContain('aria-live="polite"');
  });
  it("does not suggest authorization from real observed sample", () => {
    const html = renderToStaticMarkup(<ReactionResearchReview />);
    expect(html).toContain("not authenticated human authorization");
    expect(html).toContain("All acceptance states remain unknown");
    expect(html).not.toContain("execution approved");
    expect(html).toContain("Load two observed research cases");
    expect(html).toContain("original evidence bundle");
    expect(html).not.toContain("Load synthetic example");
  });
});
