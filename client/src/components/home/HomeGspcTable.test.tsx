/**
 * HomeGspcTable — rendered against an INJECTED payload so every assertion is
 * provably about the mock, and nothing in this file can leak into a page.
 *
 * Pinned:
 *  - the lid is totals.lid verbatim; absent lid prints an absence, not a sentence of ours
 *  - one row per axis in board order; the tally is counted from the rows
 *  - status / separation / family print verbatim; a TIE is never a win
 *  - a withheld leader prints its state; an own model is never listed as a leader
 *  - the models block lists exactly the public leaders — fewer than nine stays fewer than nine
 *  - an unread board prints "unread" with the reason and no figure
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeGspcTable from "./HomeGspcTable";
import { leaderCell, leadersNote, lidOf, publicLeaders, separationText, statusText, tally, tallyLine, unreadLine } from "./homeGspcTableReaders";
import type { GspcAxis, GspcPayload } from "../board/useGspcBoard";

const LID = "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate. (mock)";

const axes: GspcAxis[] = [
  { axis: "governance", family: "gspc", kind: "model-comparison", n: 237, status: "MEASURED", separation: "UNTESTED", public_leader_state: "EXCLUDED_OWN_MODEL", excluded_leader: "council-mock (council specialist)" },
  { axis: "safety", family: "gspc", kind: "model-comparison", n: 36, status: "MEASURED", separation: "TIE", leader: "mock-base:12b (base model)", accuracy: 0.944, interval: [0.819, 0.985] },
  { axis: "machinery-conformity", family: "gspc", kind: "model-comparison", n: 33, status: "MEASURED", separation: "UNTESTED", public_leader_state: "NO_SIGNED_CARD" },
  { axis: "swarm", family: "gspc", kind: "model-comparison", n: 37, status: "MEASURED", separation: "SEPARATED", leader: "mock-swarm:7b (base model)", accuracy: 0.384 },
  { axis: "reserve-attestation", family: "financial", kind: "deterministic-facts", n: 16, n_unit: "issuer accounts (not bank items)", status: "MEASURED", evidence_url: "/interop/mock.json" },
  { axis: "future-slot", family: "gspc", kind: "declared-slot" },
];

const payload: GspcPayload = { totals: { lid: LID, public_count: "6 axis · 5 measured (mock)", public_leader_count: 2 }, axes };

function render(p: GspcPayload | null, error: string | null = null) {
  return renderToStaticMarkup(<HomeGspcTable data={p} error={error} />);
}

describe("homeGspcTable readers", () => {
  it("quotes the lid verbatim and returns null when absent", () => {
    expect(lidOf(payload)).toBe(LID);
    expect(lidOf({ totals: {} })).toBeNull();
    expect(lidOf(null)).toBeNull();
  });

  it("prints status and separation as served; absence is UNMEASURED, facts have no test", () => {
    expect(statusText(axes[0])).toBe("MEASURED");
    expect(statusText(axes[5])).toBe("UNMEASURED");
    expect(separationText(axes[1])).toBe("TIE");
    expect(separationText(axes[4])).toBe("no fleet · not applicable");
    expect(separationText(axes[5])).toBe("not published");
  });

  it("decides the leader from the wire and never invents a name", () => {
    expect(leaderCell(axes[0])).toEqual({ kind: "withheld", state: "EXCLUDED_OWN_MODEL" });
    expect(leaderCell(axes[2])).toEqual({ kind: "withheld", state: "NO_SIGNED_CARD" });
    expect(leaderCell(axes[4])).toEqual({ kind: "facts" });
    expect(leaderCell(axes[5])).toEqual({ kind: "none" });
    const pub = leaderCell(axes[1]);
    expect(pub.kind).toBe("public");
    if (pub.kind === "public") expect(pub.model).toBe("mock-base:12b (base model)");
  });

  it("lists exactly the public leaders — two here, not nine — ordered by their own point estimate", () => {
    const l = publicLeaders(axes);
    expect(l.map((m) => m.model)).toEqual(["mock-base:12b (base model)", "mock-swarm:7b (base model)"]);
    expect(l.some((m) => /council-mock/.test(m.model))).toBe(false);
    expect(l).toHaveLength(2);
  });

  it("counts the tally from the rows and quotes the board's count beside it", () => {
    const t = tally(axes);
    expect(t.rows).toBe(6);
    expect(t.byStatus).toEqual({ MEASURED: 5, UNMEASURED: 1 });
    expect(t.byFamily).toEqual({ gspc: 5, financial: 1 });
    expect(t.publicLeaders).toBe(2);
    expect(t.withheld).toEqual({ EXCLUDED_OWN_MODEL: 1, NO_SIGNED_CARD: 1 });
    expect(t.facts).toBe(1);
    expect(tallyLine(t)).toBe("6 rows on this table · 5 MEASURED · 1 UNMEASURED · gspc 5 · financial 1");
    expect(leadersNote(t, payload.totals)).toContain("2 public leader scores on the board today");
    expect(leadersNote(t, payload.totals)).toContain("the board's own count agrees (2)");
    expect(leadersNote(t, { public_leader_count: 9 })).toContain("the board's own count says 9 — shown as served, not reconciled");
    expect(leadersNote(t, payload.totals)).toContain("a TIE is not a win");
  });

  it("names the reason when the board is unread", () => {
    expect(unreadLine("HTTP 503")).toContain("unread — GET /api/gspc did not answer (HTTP 503)");
    expect(unreadLine(null)).toContain("(no response)");
  });
});

describe("HomeGspcTable renders the payload and nothing else", () => {
  it("quotes the lid and the public count verbatim", () => {
    const html = render(payload);
    expect(html).toContain(LID);
    expect(html).toContain("6 axis · 5 measured (mock)");
  });

  it("renders one table row per axis in board order, with verbatim words", () => {
    const html = render(payload);
    const rows = html.match(/data-axis-row="([^"]+)"/g) ?? [];
    expect(rows.map((r) => r.replace(/data-axis-row="|"/g, ""))).toEqual(axes.map((a) => a.axis));
    expect(html).toContain('data-status="MEASURED"');
    expect(html).toContain('data-status="UNMEASURED"');
    expect(html).toContain('data-separation="TIE"');
    expect(html).toContain('data-separation="SEPARATED"');
    expect(html).toContain('data-leader-state="EXCLUDED_OWN_MODEL"');
    expect(html).toContain('data-leader-state="NO_SIGNED_CARD"');
    expect(html).toContain("a point lead is not a measured advantage");
    expect(html).toContain("6 rows on this table · 5 MEASURED · 1 UNMEASURED · gspc 5 · financial 1");
  });

  it("lists only the public leaders in the models block and says how many there are", () => {
    const html = render(payload);
    const block = html.slice(html.indexOf('data-testid="home-models-ranked"'));
    const models = block.match(/data-model-row="([^"]+)"/g) ?? [];
    expect(models).toHaveLength(2);
    expect(block).not.toContain("council-mock");
    expect(block).toContain("2 public leader scores on the board today");
    expect(block).toContain("nothing is padded");
  });

  it("prints unread with the reason and no figure when the board does not answer", () => {
    const html = render(null, "HTTP 503");
    expect(html).toContain('data-testid="home-board-unread"');
    expect(html).toContain("unread — GET /api/gspc did not answer (HTTP 503)");
    expect(html).not.toContain("data-axis-row=");
    expect(html).not.toContain("94.4%");
  });

  it("prints an absence, not a sentence of ours, when the lid is missing", () => {
    const html = render({ totals: {}, axes: [] });
    expect(html).toContain("The board did not publish a lid sentence.");
    expect(html).toContain("The board returned no rows.");
    expect(html).toContain("publishes no public leader score today");
  });
});
