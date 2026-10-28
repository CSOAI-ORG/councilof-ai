import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PypiLiveBadge, { PYPI_BADGE_ALT } from "./PypiLiveBadge";
import { FOOTER_IDS } from "./FooterStats";
import { HOME_HEADLINE, HOME_SECOND } from "./MomentumStrip";
import { pick, type MomentumPayload } from "./momentum";

describe("no frozen PyPI count in HTML (surface inspection, 12 Oct 2026)", () => {
  it("renders a live badge image, mirror-labelled, with no digits in the markup", () => {
    const html = renderToStaticMarkup(<PypiLiveBadge />);
    expect(html).toContain('src="https://img.shields.io/pepy/dt/csoai');
    expect(PYPI_BADGE_ALT).toMatch(/including mirrors/);
    expect(html).toContain("including mirrors");
    // Visible text carries no figure; the count lives only inside the fetched image.
    expect(html.replace(/<[^>]*>/g, "")).not.toMatch(/\d/);
  });
  it("no strip or footer asks for a pypi_* figure, and pick() drops one if asked", () => {
    for (const id of [...FOOTER_IDS, ...HOME_HEADLINE, ...HOME_SECOND]) expect(id).not.toMatch(/^pypi_/);
    const p = { figures: [{ id: "pypi_csoai_all_time" }, { id: "capsules" }] } as unknown as MomentumPayload;
    expect(pick(p).map((f) => f.id)).toEqual(["capsules"]);
    expect(pick(p, ["pypi_csoai_all_time", "capsules"]).map((f) => f.id)).toEqual(["capsules"]);
  });
});
