/**
 * FreshnessLine — the board's first line for a stranger. Rendered against INJECTED props and an
 * injected read time, so every assertion is about the mock, never the clock.
 *
 * Pinned (E2E walk 2026-11-24): the signed public root's age is counted from its as_of INSTANT at
 * the read time — "7 hours ago" the next morning, "2 days ago" at 55 h — and once the root is older
 * than the 48-hour window the line says so, with the same rule the ledger tab applies. Before this,
 * a 55-hour-old root read "3 days ago" with no marker while /corrections called it stale.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { FreshnessLine } from "./LivingBoard";
import type { BoardDoc } from "@/lib/livingBoard";

const render = (node: React.ReactNode) => renderToStaticMarkup(<Router ssrPath="/board">{node}</Router>);
const ROOT = { as_of: "2026-11-21T23:11:50Z" };

describe("FreshnessLine — the signed public root's age", () => {
  it("counts hours while the root is under a day old, and prints no stale marker", () => {
    const html = render(<FreshnessLine board={null} fleet={null} cards={null} root={ROOT} now={new Date("2026-11-22T06:33:00Z")} />);
    expect(html).toContain("signed public root as of");
    expect(html).toContain("21 Nov 2026");
    expect(html).toContain("(7 hours ago)");
    expect(html).not.toContain("older than the 48-hour root window");
  });

  it("at 55 hours says 2 days ago and marks the root older than the 48-hour window", () => {
    const html = render(<FreshnessLine board={null} fleet={null} cards={null} root={ROOT} now={new Date("2026-11-24T06:33:46Z")} />);
    expect(html).toContain("2 days ago");
    expect(html).not.toContain("3 days ago");
    expect(html).toContain("older than the 48-hour root window");
  });

  it("keeps calendar days for the DAY-precision comparison dates", () => {
    const board = {
      axes: [
        { axis: "safety", kind: "model-comparison", measurement_time: { observed_on: "2026-08-12" } },
        { axis: "swarm", kind: "model-comparison", measurement_time: { not_after: "2026-08-19T09:24:39Z" } },
      ],
    } as unknown as BoardDoc;
    const html = render(<FreshnessLine board={board} fleet={null} cards={null} root={null} now={new Date("2026-11-24T06:33:46Z")} />);
    expect(html).toContain("between <strong>12 Aug 2026</strong> and <strong>19 Aug 2026</strong>");
    expect(html).toContain("(97 days ago)");
    expect(html).not.toContain("signed public root");
  });

  it("says nothing about a root it has not read", () => {
    const html = render(<FreshnessLine board={null} fleet={null} cards={null} root={null} now={new Date("2026-11-24T06:33:46Z")} />);
    expect(html).not.toContain("signed public root");
    expect(html).not.toContain("older than");
  });
});
