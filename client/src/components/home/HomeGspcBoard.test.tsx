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
 *  - the iframe src points at the verified Space embed origin
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
  SPACE_EMBED_ORIGIN,
  SPACE_PAGE_URL,
  STRIP_N,
  leaderStateOf,
  separationLabel,
  visibleAxes,
} from "./HomeGspcBoard";
import { loadGspcBoard, type GspcAxis, type GspcPayload } from "../board/useGspcBoard";

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
].map((axis, i): GspcAxis => ({ axis, kind: "deterministic-facts", n: 6 + i, n_unit: "issuer accounts (not bank items)", status: "MEASURED" }));

const payload: GspcPayload = {
  schema: "mock",
  totals: { axes: comparison.length + facts.length, measured_axes: comparison.length + facts.length, public_count: MOCK_COUNT },
  axes: [...comparison, ...facts],
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

  it("embeds the living Space at the verified origin and links to its page", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={payload} />);
    expect(SPACE_EMBED_ORIGIN).toBe("https://csoai-gspc-board.static.hf.space");
    expect(html).toContain(`<iframe src="${SPACE_EMBED_ORIGIN}"`);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('sandbox="allow-scripts allow-same-origin allow-popups"');
    expect(html).toContain(`href="${SPACE_PAGE_URL}"`);
    expect(html).toContain("Open the living board on Hugging Face");
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
    expect(open).toContain("EXCLUDED_OWN_MODEL");
    expect(open).toContain("NO_SIGNED_CARD");
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
    const open = renderToStaticMarkup(<BoardStrip axes={facts} />);
    expect(open).toContain("deterministic facts · no leader accuracy");
    expect(open).toContain("facts · no separation test");
    expect(open).not.toMatch(/SEPARATED|UNTESTED/);
  });

  it("table view carries the same rows", () => {
    const table = renderToStaticMarkup(<BoardStrip axes={payload.axes as GspcAxis[]} initiallyExpanded initialView="table" />);
    expect(table).toContain('data-testid="board-table"');
    expect(rowCount(table)).toBe(payload.axes!.length);
    expect(table).toContain("EXCLUDED_OWN_MODEL");
    expect(table).toContain("deterministic facts · no leader accuracy");
  });

  it("links to the leaderboard and the endpoint, ends on the footer line, uses no forbidden strings", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={payload} />);
    expect(html).toContain('href="/leaderboard"');
    expect(html).toContain('href="/api/gspc"');
    expect(html).toContain("Measurement, not certification. Empty stays empty.");
    expect(html).not.toMatch(/sovereign|ceasai|byzantine|\bBFT\b/i);
    expect(html).not.toMatch(/\bcertif(y|ied)\b/i);
  });

  it("a dead board renders words, not an empty board", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={null} error="offline" />);
    expect(html).toContain("Board is unreachable right now. Empty stays empty.");
    expect(html).not.toContain("data-axis-row=");
    expect(html).toContain(`<iframe src="${SPACE_EMBED_ORIGIN}"`);
  });
});
