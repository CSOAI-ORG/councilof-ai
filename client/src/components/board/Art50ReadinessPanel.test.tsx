import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Art50ReadinessPanel, { readArt50Readiness } from "./Art50ReadinessPanel";

describe("readArt50Readiness — empty stays empty", () => {
  it("renders every row UNMEASURED when the axis publishes no readiness fields", () => {
    const rows = readArt50Readiness({ axis: "art5-safeguard" });
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.label)).toEqual([
      "Marking detected?",
      "Machine-readable?",
      "Interop format?",
    ]);
    expect(rows.every((r) => r.state === "UNMEASURED")).toBe(true);
    expect(rows.every((r) => r.reading === undefined)).toBe(true);
  });

  it("renders every row UNMEASURED for a null axis", () => {
    expect(readArt50Readiness(null).every((r) => r.state === "UNMEASURED")).toBe(true);
  });

  it("shows a row MEASURED only when the payload itself publishes it", () => {
    const rows = readArt50Readiness({
      axis: "art5-safeguard",
      art50_readiness: {
        marking_detected: { status: "MEASURED", reading: "detected on the frozen bank" },
        machine_readable: { status: "UNMEASURED" },
        interop_format: "garbage — not an entry",
      },
    });
    expect(rows[0].state).toBe("MEASURED");
    expect(rows[0].reading).toBe("detected on the frozen bank");
    expect(rows[1].state).toBe("UNMEASURED");
    expect(rows[2].state).toBe("UNMEASURED");
  });

  it("says why when everything is UNMEASURED", () => {
    const html = renderToStaticMarkup(<Art50ReadinessPanel axis={{ axis: "art5-safeguard" }} />);
    expect(html).toContain('data-testid="art50-readiness-panel"');
    expect(html).toContain("Marking detected?");
    expect(html).toContain("Machine-readable?");
    expect(html).toContain("Interop format?");
    expect(html).toContain("every row stays UNMEASURED");
  });
});
