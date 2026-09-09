/**
 * HomeGspcBoard — rendered against a MOCKED /api/gspc payload.
 *
 * The payload is served through a stubbed global fetch and read by the repo's
 * shared loader (loadGspcBoard), then handed to the component by prop, so the
 * count line on screen is provably the mock's totals.public_count and nothing in
 * this file can leak into a real page as data.
 *
 * Pinned:
 *  - the headline quotes the mocked totals.public_count verbatim
 *  - no iframe; the live API is rendered natively and Hugging Face is a mirror link
 *  - the strip shows 9 axes, "Load more (N)" is derived from the array, expanded shows all
 *  - a TIE is never rendered as a win; EXCLUDED_OWN_MODEL / NO_SIGNED_CARD print as states
 *  - facts axes print "deterministic facts · no leader accuracy"
 *  - the table view carries the same rows
 *  - a dead board renders words, not an empty board
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeGspcBoard, {
  BoardStrip,
  HubResultsBoard,
  HUB_CARDS_PAGE_URL,
  SPACE_PAGE_URL,
  STRIP_N,
  hubAxes,
  leaderStateOf,
  measuredHubCells,
  separationLabel,
  topHubModels,
  type HubCardsPayload,
  visibleAxes,
} from "./HomeGspcBoard";
import { loadGspcBoard, type GspcAxis, type GspcPayload } from "../board/useGspcBoard";
import { AXES_FIN } from "../../../../functions/api/_gspc_axes_fin";

const MOCK_COUNT = "22 axis · 22 measured (mock)";

const comparison: GspcAxis[] = [
  { axis: "governance", kind: "model-comparison", n: 237, status: "MEASURED", separation: "UNTESTED", public_leader_state: "EXCLUDED_OWN_MODEL" },
  { axis: "safety", kind: "model-comparison", n: 36, status: "MEASURED", separation: "TIE", leader: "mock-base:7b", accuracy: 0.944 },
  { axis: "machinery-conformity", kind: "model-comparison", n: 40, status: "MEASURED", separation: "UNTESTED", public_leader_state: "NO_SIGNED_CARD" },
  { axis: "swarm", kind: "model-comparison", n: 27, status: "MEASURED", separation: "SEPARATED", leader: "mock-swarm:3b", accuracy: 0.444 },
  ...["provenance", "continuity", "conformance", "openness", "care", "cross-reality", "detector-interop", "art5-safeguard", "affect", "jail"].map(
    (axis, i): GspcAxis => ({ axis, kind: "model-comparison", n: 30 + i, status: "MEASURED", separation: "UNTESTED", public_leader_state: "EXCLUDED_OWN_MODEL" }),
  ),
];
const facts: GspcAxis[] = [
  "provenance-controls",
  "reserve-attestation",
  "regulatory-framework",
  "distribution-integrity",
  "custody-disclosure",
  "ai-adoption-components",
  "labour-components",
  "humanoid-labour-index",
].map((axis, i): GspcAxis => ({
  axis,
  kind: "deterministic-facts",
  n: 6 + i,
  n_unit: "issuer accounts (not bank items)",
  status: "MEASURED",
  evidence_url: `/interop/${axis}.json`,
  run_attestation: i === 0 ? "ED25519_SIGNED" : i === 7 ? undefined : "CONTENT_ADDRESSED_UNSIGNED",
}));

const payload: GspcPayload = {
  schema: "mock",
  totals: { axes: comparison.length + facts.length, measured_axes: comparison.length + facts.length, public_count: MOCK_COUNT },
  axes: [...comparison, ...facts],
};

const hubPayload: HubCardsPayload = {
  schema: "csoai.hub-cards/0.2",
  as_of: "2026-09-07T10:00:00Z",
  source: "huggingface.co/datasets/csoai/gspc-hub-cards",
  population: "third-party models on the Hub — NOT the CSOAI fleet",
  counts: { complete: true, measured: 12, unmeasured: 1, cells: 13 },
  cells: [
    ...Array.from({ length: 10 }, (_, index) => ({
      model: `publisher/model-${index + 1}`,
      axis: "gspc-safety",
      status: "MEASURED",
      accuracy: 1 - index / 20,
      n: 30,
      card_sha256: `sha-${index + 1}`,
      card_url: `/signed/cards/card-${index + 1}.json`,
      signed: true,
    })),
    {
      model: "publisher/tied-model",
      axis: "gspc-safety",
      status: "MEASURED",
      accuracy: 1,
      n: 30,
      card_sha256: "sha-tied",
      card_url: "/signed/cards/card-tied.json",
      signed: true,
    },
    {
      model: "publisher/other-axis",
      axis: "gspc-governance",
      status: "MEASURED",
      accuracy: 0.7,
      n: 30,
      card_sha256: "sha-other",
      card_url: "/signed/cards/card-other.json",
      signed: true,
    },
    {
      model: "publisher/pending",
      axis: "gspc-safety",
      status: "UNMEASURED",
      accuracy: 0.99,
      n: 30,
      card_sha256: "sha-pending",
      card_url: "/signed/cards/card-pending.json",
      signed: true,
      unmeasured: ["signed-pending-verify"],
    },
  ],
};

const rowCount = (html: string) => (html.match(/data-axis-row="/g) ?? []).length;

async function loadThroughMockedFetch(): Promise<GspcPayload> {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify(payload) })),
  );
  return loadGspcBoard();
}

describe("HomeGspcBoard (mocked /api/gspc)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("quotes the mocked totals.public_count verbatim, read through the shared loader", async () => {
    const data = await loadThroughMockedFetch();
    expect(data.totals?.public_count).toBe(MOCK_COUNT);
    const html = renderToStaticMarkup(<HomeGspcBoard data={data} />);
    expect(html).toContain('data-testid="gspc-public-count"');
    expect(html).toContain(MOCK_COUNT);
  });

  it("does not iframe Hugging Face; renders /api/gspc natively and links to the mirror", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={payload} />);
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("csoai-gspc-board.static.hf.space");
    expect(html).toContain(`href="${SPACE_PAGE_URL}"`);
    expect(html).toContain("Open the GSPC board mirror on Hugging Face");
    expect(html).toContain("rendered directly here; Hugging Face is a distribution mirror");
    expect(html).not.toContain("This page embeds it and does not redraw it");
    expect(html).not.toContain("gspc-governance-leaderboard");
  });

  it("shows 9 axes and a Load more derived from the array; expanded shows every axis", () => {
    const all = payload.axes!.length;
    const html = renderToStaticMarkup(<HomeGspcBoard data={payload} />);
    expect(STRIP_N).toBe(9);
    expect(rowCount(html)).toBe(9);
    expect(html).toContain(`Load more (${all - 9})`);
    expect(html).not.toContain('data-axis-row="humanoid-labour-index"');

    const open = renderToStaticMarkup(<BoardStrip axes={payload.axes as GspcAxis[]} initiallyExpanded />);
    expect(rowCount(open)).toBe(all);
    expect(open).toContain("Show less");
    expect(open).toContain('data-axis-row="humanoid-labour-index"');
    expect(visibleAxes(payload.axes as GspcAxis[], false)).toHaveLength(9);
    expect(visibleAxes(payload.axes as GspcAxis[], true)).toHaveLength(all);
  });

  it("never renders a TIE as a win", () => {
    const open = renderToStaticMarkup(<BoardStrip axes={payload.axes as GspcAxis[]} initiallyExpanded />);
    expect(open).toContain("TIE");
    expect(open).toContain("not a measured advantage");
    expect(open).not.toMatch(/\bwinner\b/i);
    expect(open).not.toMatch(/\bwins\b/i);
    expect(open).not.toMatch(/\bwon\b/i);
    expect(separationLabel(comparison[1])).toBe("TIE · not a measured advantage");
  });

  it("prints leader states as text and never a made-up leader", () => {
    const open = renderToStaticMarkup(<BoardStrip axes={payload.axes as GspcAxis[]} initiallyExpanded />);
    expect(open).toContain('data-leader-state="EXCLUDED_OWN_MODEL"');
    expect(open).toContain('data-leader-state="NO_SIGNED_CARD"');
    expect(open).toContain("Our own model held the point lead");
    expect(open).toContain("has no verifiable signed card");
    expect(open).toContain("mock-base:7b");
    expect(open).toContain("mock-swarm:3b");
    expect(leaderStateOf(comparison[0])).toBe("EXCLUDED_OWN_MODEL");
    expect(leaderStateOf(comparison[2])).toBe("NO_SIGNED_CARD");
    expect(leaderStateOf(comparison[1])).toBe("PUBLIC");
    expect(leaderStateOf(facts[0])).toBe("FACTS");
    // An excluded axis carries no name in its leader text.
    const gov = renderToStaticMarkup(<BoardStrip axes={[comparison[0]]} />);
    expect(gov).not.toContain("Leader:");
  });

  it("facts axes print the facts note and no separation verdict", () => {
    const open = renderToStaticMarkup(<BoardStrip axes={facts} initiallyExpanded />);
    expect(open).toContain("deterministic facts · no leader accuracy");
    expect(open).toContain("facts · no separation test");
    expect(open).toContain("Ed25519-signed run");
    expect(open).toContain("Content-addressed unsigned run");
    expect(open).toContain("Run artifact");
    expect(open).toContain('/interop/reserve-attestation.json');
    expect(open).not.toContain('href="/dashboard?tab=leaderboard#provenance-controls"');
    expect(open).not.toMatch(/SEPARATED|UNTESTED/);
  });

  it("links model axes to model evidence while fact axes link their own run", () => {
    const html = renderToStaticMarkup(<BoardStrip axes={[comparison[1], facts[1]]} initiallyExpanded />);
    expect(html).toContain('href="/gspc/safety/"');
    expect(html).toContain('href="/interop/reserve-attestation.json"');
    expect(html).not.toContain('tab=leaderboard');
  });

  it("fails closed when a facts row has no published run artifact", () => {
    const html = renderToStaticMarkup(
      <BoardStrip axes={[{ axis: "future-fact", kind: "deterministic-facts", status: "MEASURED" }]} />,
    );
    expect(html).toContain("No run artifact published.");
    expect(html).not.toContain('href="/dashboard?tab=leaderboard"');
  });

  it("renders the actual eight financial runs as exactly one signed and seven unsigned links", () => {
    const actualFacts = AXES_FIN as unknown as GspcAxis[];
    const list = renderToStaticMarkup(<BoardStrip axes={actualFacts} initiallyExpanded />);
    const table = renderToStaticMarkup(
      <BoardStrip axes={actualFacts} initiallyExpanded initialView="table" />,
    );

    expect(actualFacts).toHaveLength(8);
    expect(actualFacts.filter((axis) => axis.run_attestation === "ED25519_SIGNED")).toHaveLength(1);
    expect(actualFacts.filter((axis) => axis.run_attestation === "CONTENT_ADDRESSED_UNSIGNED")).toHaveLength(7);
    expect(list.match(/>Ed25519-signed run</g) ?? []).toHaveLength(1);
    expect(list.match(/>Content-addressed unsigned run</g) ?? []).toHaveLength(7);
    expect(table.match(/>Ed25519-signed run</g) ?? []).toHaveLength(1);
    expect(table.match(/>Content-addressed unsigned run</g) ?? []).toHaveLength(7);
    for (const axis of actualFacts) {
      expect(axis.evidence_url).toMatch(/^\/interop\/.+\.json$/);
      expect(list).toContain(`href="${axis.evidence_url}"`);
      expect(table).toContain(`href="${axis.evidence_url}"`);
    }
    expect(list).not.toContain("tab=leaderboard");
    expect(table).not.toContain("tab=leaderboard");
  });

  it("table view carries the same rows", () => {
    const table = renderToStaticMarkup(<BoardStrip axes={payload.axes as GspcAxis[]} initiallyExpanded initialView="table" />);
    expect(table).toContain('data-testid="board-table"');
    expect(rowCount(table)).toBe(payload.axes!.length);
    expect(table).toContain('data-leader-state="EXCLUDED_OWN_MODEL"');
    expect(table).toContain("deterministic facts · no leader accuracy");
  });

  it("links to the leaderboard and the endpoint, ends on the footer line, uses no forbidden strings", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={payload} />);
    expect(html).toContain('href="/dashboard?tab=leaderboard"');
    expect(html).toContain("Signed model-card matrix");
    expect(html).toContain('href="/api/gspc"');
    expect(html).toContain("Measurement, not certification. Empty stays empty.");
    expect(html).toContain("Witnesses bind exact root bytes and may still be pending.");
    expect(html).not.toContain("Root is signed and witnessed.");
    expect(html).not.toMatch(/sovereign|ceasai|byzantine|\bBFT\b/i);
    expect(html).not.toMatch(/\bcertif(y|ied)\b/i);
  });

  it("a dead board renders words, not an empty board", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={null} error="offline" />);
    expect(html).toContain("Board is unreachable right now. Empty stays empty.");
    expect(html).not.toContain("data-axis-row=");
    expect(html).not.toContain("<iframe");
  });

  it("renders the Hub feed as a separate interactive measured-model table", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={payload} hubData={hubPayload} />);
    expect(html).toContain("Hugging Face measured-model results");
    expect(html).toContain('data-testid="hub-results-table"');
    expect(html).toContain(`href="${HUB_CARDS_PAGE_URL}"`);
    expect(html).toContain("12 published MEASURED cells · 12 models · 2 model axes");
    expect(html).toContain("publisher/model-1");
    expect(html).not.toContain("publisher/pending");
    expect(html.match(/data-hub-model-row=/g) ?? []).toHaveLength(9);
    expect(html).toContain("Ordering is not a separation test");
    expect(html).toContain("deterministic fact axes do not rank models");
  });

  it("filters Hub rows by exact published state and sorts without fusing instruments", () => {
    expect(hubAxes(hubPayload)).toEqual(["gspc-governance", "gspc-safety"]);
    expect(measuredHubCells(hubPayload)).toHaveLength(12);
    const leaders = topHubModels(hubPayload, "gspc-safety");
    expect(leaders).toHaveLength(9);
    expect(leaders[0].accuracy).toBe(1);
    expect(leaders[1].accuracy).toBe(1);
    expect(leaders.every((cell) => cell.axis === "gspc-safety" && cell.status === "MEASURED" && cell.signed)).toBe(true);
  });

  it("withholds Hub population totals when an index read is incomplete", () => {
    const partial: HubCardsPayload = {
      ...hubPayload,
      counts: { complete: false, measured: null, unmeasured: null, cells: null, read_so_far: { measured: 12, cells: 13 } },
    };
    const html = renderToStaticMarkup(<HubResultsBoard data={partial} />);
    expect(html).toContain("Partial read · 12 retrieved MEASURED cells · population totals withheld");
    expect(html).not.toContain("12 published MEASURED cells");
  });

  it("keeps a previous table visible during refresh and labels a failed refresh stale", () => {
    const pending = renderToStaticMarkup(<HubResultsBoard data={hubPayload} loading />);
    expect(pending).toContain('Refreshing Hub cells · showing the previous snapshot.');
    expect(pending).toContain('data-testid="hub-results-table"');
    const stale = renderToStaticMarkup(<HubResultsBoard data={hubPayload} error="offline" />);
    expect(stale).toContain('Refresh failed · showing the previous snapshot, not current results.');
    expect(stale).toContain('data-testid="hub-results-table"');
    expect(stale).toContain('Feed observed 2026-09-07T10:00:00Z');
    expect(stale).not.toContain('12 published MEASURED cells');
    const unavailable = renderToStaticMarkup(<HubResultsBoard data={null} error="offline" />);
    expect(unavailable).toContain('Hub results are unreachable. No result was inferred.');
    expect(unavailable).not.toContain('data-testid="hub-results-table"');
  });
});
