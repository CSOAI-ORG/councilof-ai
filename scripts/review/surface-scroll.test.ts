import { afterEach, describe, expect, it, vi } from "vitest";
import {
  nextViewportStop,
  primaryScrollMetrics,
} from "../../e2e/support/scrollCoverage.mjs";
afterEach(() => vi.unstubAllGlobals());

describe("full-page scroll coverage", () => {
  it("measures the actual Council OS canvas before falling back to document scrolling", () => {
    const canvas = {
      getClientRects: () => [{}],
      clientHeight: 600,
      clientWidth: 900,
      scrollHeight: 6000,
      scrollWidth: 900,
      scrollTop: 1200,
    };
    let selected: string | null = '[data-testid="dashboard-tool-canvas"]';
    vi.stubGlobal("document", {
      querySelector: (selector: string) =>
        selector === selected ? canvas : null,
      documentElement: { scrollHeight: 1000, scrollWidth: 1440 },
    });
    vi.stubGlobal("innerWidth", 1440);
    vi.stubGlobal("innerHeight", 1000);
    vi.stubGlobal("scrollY", 0);
    expect(primaryScrollMetrics()).toMatchObject({
      target: selected,
      position: 1200,
      height: 6000,
      viewport: 600,
    });
    selected = '[data-testid="gspc-workspace-home"]';
    expect(primaryScrollMetrics().target).toBe(selected);
    selected = null;
    expect(primaryScrollMetrics()).toMatchObject({
      target: "window",
      position: 0,
      height: 1000,
      viewport: 1000,
    });
  });
  it("visits overlapping viewport stops, including the middle, before marking bottom complete", () => {
    let position = 0;
    const stops = [position];
    for (let steps = 0; steps < 30; steps++) {
      const next = nextViewportStop(
        { position, height: 10_000, viewport: 844 },
        { steps },
      );
      if (next.done) break;
      position = next.target;
      stops.push(position);
    }
    expect(stops.length).toBeGreaterThan(10);
    expect(stops.some((y) => y > 4000 && y < 6000)).toBe(true);
    expect(stops.every((y, i) => i === 0 || y - stops[i - 1] < 844)).toBe(true);
    expect(
      nextViewportStop({ position, height: 10_000, viewport: 844 }).done,
    ).toBe(true);
  });
  it("does not count an old bottom as complete if lazy content extends the document", () => {
    expect(
      nextViewportStop({ position: 1200, height: 2000, viewport: 800 }).done,
    ).toBe(true);
    expect(
      nextViewportStop({ position: 1200, height: 4000, viewport: 800 }).done,
    ).toBe(false);
  });
  it("fails with explicit incomplete states at step/time limits and for unmeasurable layouts", () => {
    expect(() =>
      nextViewportStop(
        { position: 1000, height: 100_000, viewport: 844 },
        { steps: 300 },
      ),
    ).toThrow("INCOMPLETE: viewport-step cap");
    expect(() =>
      nextViewportStop(
        { position: 1000, height: 100_000, viewport: 844 },
        { elapsedMs: 20_000 },
      ),
    ).toThrow("INCOMPLETE: time budget");
    expect(() =>
      nextViewportStop({ position: 0, height: 0, viewport: 0 }),
    ).toThrow("Cannot measure");
  });
});
