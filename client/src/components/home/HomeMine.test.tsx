import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import HomeMine from "./HomeMine";

vi.mock("@/components/NewsletterSignup", () => ({
  default: () => <div data-testid="newsletter-stub" />,
}));

describe("homepage report archive", () => {
  it("keeps the report archive and newsletter without duplicating the live board", () => {
    const html = renderToStaticMarkup(<HomeMine />);
    expect(html).toContain('data-testid="home-report-archive-band"');
    expect(html).toContain("Published measurement reports");
    expect(html).toContain("Browse published reports");
    expect(html).toContain('data-testid="newsletter-stub"');
    expect(html).not.toContain('data-testid="home-living-strip"');
  });
});
