/**
 * SeparationDisclosure.test.tsx — the disclosure renders the rule, never a verdict.
 *
 * SSR-rendered like the rest of the suite (renderToStaticMarkup). Fixture axes mirror the live
 * board's shape: safety TIE n=36 (no p published yet in the fixture's first case; p published in
 * the second). Nothing here may produce the word SEPARATED as a state of the board.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import SeparationDisclosure, { tieRows } from "./SeparationDisclosure";
import type { GspcPayload, GspcAxis } from "@/components/board/useGspcBoard";

const axis = (over: Partial<GspcAxis>): GspcAxis =>
  ({ axis: "safety", status: "MEASURED", kind: "model-comparison", separation: "TIE", n: 36, ...over }) as GspcAxis;

const payload = (axes: GspcAxis[]): GspcPayload =>
  ({
    schema: "csoai.gspc-axes/0.5",
    totals: { axes: axes.length + 2, measured_axes: axes.length, comparison_axes: axes.length, separated_leads: 0, ties: axes.length, untested_separations: 0 },
    axes,
  }) as GspcPayload;

const render = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("SeparationDisclosure", () => {
  it("closed by default; opening is the reader's action", () => {
    const html = render(<SeparationDisclosure variant="live" data={null} />);
    expect(html).toContain("The family rule a separated leader must clear");
    expect(html).not.toContain("IN FORCE · adopted 2026-11-04");
  });

  it("static variant: the rule, the 14-step table, and the honest ~51% odds line", () => {
    const html = render(<SeparationDisclosure variant="static" defaultOpen />);
    expect(html).toContain("Holm step-down");
    expect(html).toContain("51%");
    expect(html).toContain("1 of 14");
    expect(html).toContain("14 of 14");
    expect(html).toContain("IN FORCE · adopted 2026-11-04");
  });

  it("live variant with an unread board: says so, shows nothing in its place", () => {
    const html = render(<SeparationDisclosure variant="live" data={null} />);
    expect(html).not.toContain("must clear (Holm)");
  });

  it("live variant with fixture TIE axes and p-values: ranks by p against Holm steps, upgrades nothing", () => {
    const axes = [
      axis({ axis: "safety", separation_p: 0.6875 }),
      axis({ axis: "governance", separation_p: 0.03, n: 237 }),
      axis({ axis: "provenance", separation_p: 0.004 }),
    ];
    const html = render(<SeparationDisclosure variant="live" defaultOpen data={payload(axes)} />);
    // ranked smallest-p first: provenance 0.004 → governance 0.03 → safety 0.6875
    const order = ["provenance", "governance", "safety"];
    const positions = order.map((a) => html.indexOf(`sep-disclosure-live-${a}`));
    expect(positions.every((p) => p > 0)).toBe(true);
    expect(positions[0]).toBeLessThan(positions[1]);
    expect(positions[1]).toBeLessThan(positions[2]);
    // governance at 0.03: rank-2 Holm step for a 3-axis family is 0.05/2=0.025 → 0.03 misses.
    expect(html).toContain("does not clear its step");
    // provenance 0.004 clears rank-1 step 0.05/3≈0.01667 — but the verdict sentence stays honest.
    expect(html).toContain("clears its step under the family rule");
    expect(html).toContain("family size");
  });

  it("UNTESTED axes carry the board's own wait-state, read verbatim; an absent reason reads 'not stated'", () => {
    const axes = [
      axis({ axis: "jail", separation: "UNTESTED", method_status: "legacy: 27 distinct prompts, n<30" }),
      axis({ axis: "swarm", separation: "UNTESTED", method_status: "legacy: bank sha points to retired bank" }),
      axis({ axis: "governance", separation_p: 0.03 }),
    ];
    const html = render(
      <SeparationDisclosure variant="live" defaultOpen data={payload(axes)} />,
    );
    expect(html).toContain("waiting on: legacy: 27 distinct prompts, n&lt;30"); // verbatim, escaped
    expect(html).toContain("waiting on: legacy: bank sha points to retired bank");
    expect(html).toContain("sep-disclosure-untested-jail");
    // a TIE axis is not an UNTESTED axis; the two lists never borrow from each other
    expect(html).not.toContain("sep-disclosure-untested-governance");
  });

  it("an UNTESTED axis with no stated reason reads 'not stated', never an invented one", () => {
    const axes = [axis({ axis: "swarm", separation: "UNTESTED", method_status: undefined, note: undefined })];
    const html = render(<SeparationDisclosure variant="live" defaultOpen data={payload(axes)} />);
    expect(html).toContain("waiting on: <span>not stated</span>");
  });

  it("TIE axes with no published p are listed, never dropped", () => {
    const rows = tieRows([axis({ separation_p: undefined }), axis({ axis: "continuity", separation_p: 0.2 })]);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.axis === "safety")?.p).toBeNull();
  });

  it("explorer variant: inputs render with bounds and the formula is shown, not a fake measurement", () => {
    const html = render(<SeparationDisclosure variant="explorer" defaultOpen />);
    expect(html).toContain("required paired items");
    expect(html).toContain("This box measures nothing");
    expect(html).toContain("sep-disclosure-explorer-discordance");
  });

  it("no variant ever prints SEPARATED as a board state", () => {
    for (const variant of ["static", "live", "explorer"] as const) {
      const html = render(<SeparationDisclosure variant={variant} defaultOpen data={payload([axis({ separation_p: 0.0001 })])} />);
      expect(html).not.toContain("SEPARATED ·");
      expect(html).not.toContain("separated leader is");
    }
  });
});
