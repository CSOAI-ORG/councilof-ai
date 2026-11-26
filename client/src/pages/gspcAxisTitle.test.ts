import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gspcPageHeading, gspcPageTitle } from "./gspcAxisTitle";

/**
 * E2E walk 2026-11-26: /gspc/governance/ (reached by clicking "Governance" on /board/) served the
 * board's <title> and <h1>; the axis name first appeared about three screens down. The page must
 * name the axis the reader chose, and still take its count only from GET /api/gspc.
 */
describe("the /gspc/<axis> title and heading name the axis the reader clicked", () => {
  it("leads the title with the axis and keeps the live board count after it", () => {
    expect(gspcPageTitle("governance", "34 axes · 34 measured")).toBe(
      "governance axis — The GSPC board — 34 axes · 34 measured | Council of AI",
    );
  });

  it("falls back to 'live' before GET /api/gspc has supplied a count, never a typed number", () => {
    expect(gspcPageTitle("governance", null)).toBe("governance axis — The GSPC board — live | Council of AI");
    expect(gspcPageTitle("governance", "   ")).toBe("governance axis — The GSPC board — live | Council of AI");
    expect(gspcPageTitle(null, null)).toBe("The GSPC board — live | Council of AI");
  });

  it("keeps the plain board title and heading on /board itself", () => {
    expect(gspcPageTitle(null, "34 axes · 34 measured")).toBe("The GSPC board — 34 axes · 34 measured | Council of AI");
    expect(gspcPageHeading(null, false)).toBe("The GSPC board");
  });

  it("names the axis in the heading only when the board publishes it", () => {
    expect(gspcPageHeading("governance", true)).toBe("The GSPC board · governance");
    expect(gspcPageHeading("not-an-axis", false)).toBe("The GSPC board");
  });

  it("is what GspcScoreboard.tsx uses for document.title and the h1 (source read)", () => {
    const page = readFileSync(resolve(__dirname, "GspcScoreboard.tsx"), "utf8");
    expect(page).toContain('from "./gspcAxisTitle"');
    expect(page).toMatch(/document\.title = gspcPageTitle\(/);
    expect(page).toMatch(/<h1[^>]*>\{gspcPageHeading\(/);
    // The two typed titles this replaces must be gone.
    expect(page).not.toContain('document.title = "The GSPC board — live | Council of AI"');
    expect(page).not.toContain("document.title = `The GSPC board — ${count} | Council of AI`");
  });
});
