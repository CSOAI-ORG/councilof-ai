/**
 * LivingBoardStrip — the compact LIVE board under the hero (owner, 1 Nov 2026).
 * Rendered against INJECTED payloads so every assertion is about the mock. What is pinned:
 * the header counts come off totals (never typed); rows are the payload's model-comparison
 * axes at their top accuracy with their separation chips; a missing figure is an em dash,
 * never zero; and a failed or absent read renders NOTHING (never a broken homepage).
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import LivingBoardStrip, { rankedComparisonRows } from "./LivingBoardStrip";
import type { GspcPayload } from "../board/useGspcBoard";

function render(node: React.ReactNode): string {
  return renderToStaticMarkup(<Router ssrPath="/">{node}</Router>);
}

const axis = (over: Partial<GspcPayload["axes"][number]> & { axis: string }): GspcPayload["axes"][number] =>
  ({
    kind: "model-comparison",
    status: "MEASURED",
    separation: "TIE",
    ...over,
  }) as GspcPayload["axes"][number];

const board: GspcPayload = {
  totals: { axes: 33, measured_axes: 23 },
  axes: [
    axis({ axis: "care", accuracy: 0.405, n: 234 }),
    axis({ axis: "safety", accuracy: 0.9444, n: 402, separation: "TIE" }),
    axis({ axis: "machinery-conformity", separation: "UNTESTED" }), // no published figure
    axis({ axis: "a-fact-axis", kind: "deterministic-facts", accuracy: 0.99 }), // never a strip row
  ],
};

describe("LivingBoardStrip", () => {
  it("prints the header counts off totals, never typed, and marks the board live", () => {
    const html = render(<LivingBoardStrip data={board} />);
    expect(html).toContain("The living board");
    expect(html).toContain("33 axes");
    expect(html).toContain("23 measured");
    expect(html).toContain("live");
  });

  it("omits the counts fragment when totals does not carry them, and never prints a guessed zero", () => {
    const html = render(
      <LivingBoardStrip data={{ axes: board.axes }} />,
    );
    expect(html).not.toContain("axes ·");
    expect(html).toContain("The living board");
  });

  it("renders only model-comparison axes, ranked by top accuracy with the state on the chip", () => {
    const html = render(<LivingBoardStrip data={board} />);
    expect(html).not.toContain("a-fact-axis"); // a fact axis is never a strip row
    const rows = rankedComparisonRows(board);
    expect(rows.map((a) => a.axis)).toEqual([
      "safety",
      "care",
      "machinery-conformity",
    ]);
    expect(html).toContain("data-separation=\"TIE\"");
    expect(html).toContain("data-separation=\"UNTESTED\"");
    expect(html).toContain("94.4%");
    expect(html).toContain("40.5%");
  });

  it("prints an em dash, never a zero, where the payload publishes no figure", () => {
    const html = render(<LivingBoardStrip data={board} />);
    expect(html).toContain("machinery-conformity");
    expect(html).toMatch(/machinery-conformity[\s\S]{0,400}?—/);
  });

  it("links the full board and each row to its own axis page", () => {
    const html = render(<LivingBoardStrip data={board} />);
    expect(html).toContain('href="/board"');
    expect(html).toContain("Open the full board");
    expect(html).toContain('href="/gspc/safety/"');
  });

  it("renders NOTHING when the read failed or the payload is absent — never a broken section", () => {
    expect(render(<LivingBoardStrip data={null} />)).toBe("");
    expect(render(<LivingBoardStrip data={board} error="HTTP 503" />)).toBe("");
  });

  it("renders NOTHING when the payload carries no model-comparison axes", () => {
    expect(
      render(
        <LivingBoardStrip
          data={{ totals: { axes: 2, measured_axes: 1 }, axes: [axis({ axis: "reserve-attestation", kind: "deterministic-facts" })] }}
        />,
      ),
    ).toBe("");
  });

  it("hides header and footer when embedded, for a host that already prints its own count line", () => {
    const html = render(<LivingBoardStrip data={board} showHeader={false} showFooter={false} />);
    expect(html).not.toContain("The living board");
    expect(html).not.toContain("Open the full board");
    expect(html).toContain("safety");
  });
});
