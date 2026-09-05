import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CanonicalGspcBoardView,
  axisModelRanking,
  axisEvidenceKind,
  axisEvidenceState,
  boardSnapshotState,
  safeHfDatasetUrl,
  safeRunUrl,
  selectBoardRows,
  sortAxisRankingRows,
  type BoardQuery,
} from "./CanonicalGspcBoard";
import {
  MAX_GSPC_POLL_MS,
  MIN_GSPC_POLL_MS,
  boundedGspcPollMs,
  type GspcAxis,
  type GspcPayload,
} from "./useGspcBoard";
import LiveLeaderboard from "./LiveLeaderboard";

const axes: GspcAxis[] = [
  {
    axis: "safety",
    family: "gspc",
    kind: "model-comparison",
    status: "MEASURED",
    bench: "DefBench",
    n: 36,
    accuracy: 0.944,
    separation: "TIE",
    leader: "example/base",
    dataset_url: "https://huggingface.co/datasets/csoai/gspc-agi",
  },
  {
    axis: "governance",
    family: "gspc",
    kind: "model-comparison",
    status: "MEASURED",
    n: 237,
    public_leader_state: "EXCLUDED_OWN_MODEL",
    dataset_url: "https://huggingface.co/datasets/csoai/gspc-gov",
  },
  {
    axis: "provenance-controls",
    family: "financial",
    kind: "deterministic-facts",
    status: "MEASURED",
    n: 6,
    n_unit: "issuer accounts",
    coverage: "6 of 16 instruments",
    run_attestation: "ED25519_SIGNED",
    evidence_url: "/interop/financial-measure-run-v2.json",
    dataset_url:
      "https://huggingface.co/datasets/csoai/gspc-provenance-controls",
  },
  {
    axis: "future-slot",
    family: "financial",
    kind: "declared-slot",
    status: "UNMEASURED",
  },
];

const payload: GspcPayload = {
  schema: "csoai.gspc-axes/0.5",
  totals: {
    axes: 4,
    measured_axes: 3,
    lid: "4 axes · 3 measured · not a certificate.",
  },
  measured_on: {
    date: "behavioural 2026-08-12 · facts 2026-08-25",
    living_stamp: {
      signed: true,
      verifiable: true,
      verification_state: "VERIFIED",
    },
  },
  axes,
};

const baseQuery: BoardQuery = {
  text: "",
  family: "all",
  evidence: "all",
  sort: "axis",
  direction: "asc",
};

describe("canonical living GSPC board", () => {
  it("keeps scored, withheld, fact, and gap states distinct", () => {
    expect(axisEvidenceKind(axes[0])).toBe("figures");
    expect(axisEvidenceState(axes[0])).toBe("MEASURED · TIE");
    expect(axisEvidenceKind(axes[1])).toBe("withheld");
    expect(axisEvidenceState(axes[1])).toBe("MEASURED · EXCLUDED OWN MODEL");
    expect(axisEvidenceKind(axes[2])).toBe("facts");
    expect(axisEvidenceState(axes[2])).toBe(
      "MEASURED · SOURCE REPORTS ED25519 SIGNED",
    );
    expect(axisEvidenceKind(axes[3])).toBe("gaps");
    expect(axisEvidenceState(axes[3])).toBe("UNMEASURED");
  });

  it("filters the shared axis array and always sorts missing figures last", () => {
    expect(
      selectBoardRows(axes, {
        ...baseQuery,
        sort: "figure",
        direction: "desc",
      }).map((a) => a.axis),
    ).toEqual(["safety", "governance", "provenance-controls", "future-slot"]);
    expect(
      selectBoardRows(axes, { ...baseQuery, evidence: "withheld" }).map(
        (a) => a.axis,
      ),
    ).toEqual(["governance"]);
    expect(
      selectBoardRows(axes, {
        ...baseQuery,
        family: "financial",
        text: "issuer",
      }).map((a) => a.axis),
    ).toEqual(["provenance-controls"]);
  });

  it("links only exact public CSOAI Hugging Face banks and safe local run paths", () => {
    expect(
      safeHfDatasetUrl("https://huggingface.co/datasets/csoai/gspc-gov"),
    ).toBe("https://huggingface.co/datasets/csoai/gspc-gov");
    expect(
      safeHfDatasetUrl("https://huggingface.co/spaces/csoai/gspc-board"),
    ).toBeNull();
    expect(
      safeHfDatasetUrl("https://attacker.example/datasets/csoai/gspc-gov"),
    ).toBeNull();
    expect(
      safeHfDatasetUrl("https://huggingface.co/datasets/other/gspc-gov"),
    ).toBeNull();
    expect(safeRunUrl("/interop/run.json")).toBe("/interop/run.json");
    expect(safeRunUrl("//attacker.example/run.json")).toBeNull();
    expect(safeRunUrl("javascript:alert(1)")).toBeNull();
  });

  it("renders observation time separately from measurement dates and never turns null into zero", () => {
    const html = renderToStaticMarkup(
      <CanonicalGspcBoardView
        data={payload}
        error={null}
        loading={false}
        refreshing={false}
        observedAt="2026-09-05T03:17:22.123Z"
        sourceUrl="/api/gspc"
        onRefresh={() => {}}
      />,
    );
    expect(html).toContain("RUNTIME_OBSERVED");
    expect(html).toContain("2026-09-05 03:17:22Z");
    expect(html).toContain("behavioural 2026-08-12 · facts 2026-08-25");
    expect(html).toContain("SOURCE-REPORTED VERIFIED");
    expect(html).toContain("Row signatures: not separately verified");
    expect(html).toContain("Frozen HF item bank (not the ranking feed)");
    expect(html).toContain("94.4%");
    expect(html).toContain("No public leader");
    expect(html).toContain("Not applicable");
    expect(html).not.toContain("0.0%");
    expect(html).toContain("https://huggingface.co/datasets/csoai/gspc-agi");
    expect(boardSnapshotState(payload)).toBe("SOURCE-REPORTED VERIFIED");
    expect(
      boardSnapshotState({
        measured_on: { living_stamp: { signed: true, verifiable: true } },
      }),
    ).toBe("SOURCE REPORTS SIGNED · NOT REVERIFIED HERE");
  });

  it("renders only authentic current-axis rows and keeps missing seats visible", () => {
    const jail: GspcAxis = {
      axis: "jail",
      family: "gspc",
      kind: "model-comparison",
      status: "MEASURED",
      separation: "TIE",
      per_model: Object.fromEntries(
        Array.from({ length: 7 }, (_, index) => [
          `model-${index + 1}`,
          {
            n: 71 - index,
            accuracy: 0.59 - index * 0.01,
            quotable: true,
          },
        ]),
      ),
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-jail-goldbank",
    };
    const ranking = axisModelRanking(jail);
    expect(ranking.state).toBe("PUBLISHED_ROWS");
    expect(ranking.rows).toHaveLength(7);
    expect(ranking.note).toContain("7 comparable per-model result rows");

    const html = renderToStaticMarkup(
      <CanonicalGspcBoardView
        data={{
          ...payload,
          totals: { axes: 1, measured_axes: 1 },
          axes: [jail],
        }}
        error={null}
        loading={false}
        refreshing={false}
        observedAt="2026-09-05T03:17:22.123Z"
        sourceUrl="/api/gspc"
        onRefresh={() => {}}
      />,
    );
    expect(html).toContain("7/9 comparable model seats published");
    expect(html.match(/Not published on this current axis/g)).toHaveLength(2);
    expect(html).toContain("TIE — no measured advantage");
    expect(html).not.toContain("statistically ranked");
  });

  it("caps a valid cohort at nine and gives exact numeric ties one display position", () => {
    const perModel = Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [
        `model-${String(index + 1).padStart(2, "0")}`,
        {
          n: 40 + index,
          accuracy: index < 2 ? 0.9 : 0.88 - index * 0.01,
          quotable: true,
        },
      ]),
    );
    const ranking = axisModelRanking({
      axis: "safety",
      kind: "model-comparison",
      status: "MEASURED",
      per_model: perModel,
    });
    expect(ranking.state).toBe("PUBLISHED_ROWS");
    expect(ranking.rows).toHaveLength(9);
    expect(ranking.published).toBe(10);
    expect(ranking.omitted).toBe(1);
    expect(ranking.rows.slice(0, 3).map((row) => row.displayPosition)).toEqual([
      1, 1, 3,
    ]);
    expect(ranking.rows.slice(0, 2).every((row) => row.sameFigure)).toBe(true);
    expect(sortAxisRankingRows(ranking.rows, "coverage")[0].n).toBe(48);
    expect(sortAxisRankingRows(ranking.rows, "model")[0].model).toBe(
      "model-01",
    );
  });

  it("does not import old taxonomy, malformed rows, or facts into a model table", () => {
    const row = { n: 32, accuracy: 0.8, quotable: true };
    expect(
      axisModelRanking({
        axis: "gov",
        kind: "model-comparison",
        status: "MEASURED",
        per_model: { model: row },
      }).state,
    ).toBe("NOT_PUBLISHED");
    expect(
      axisModelRanking({
        axis: "slot15",
        kind: "model-comparison",
        status: "MEASURED",
        per_model: { model: row },
      }).state,
    ).toBe("NOT_PUBLISHED");
    expect(
      axisModelRanking({
        axis: "safety",
        kind: "model-comparison",
        status: "MEASURED",
      }).state,
    ).toBe("NOT_PUBLISHED");
    expect(axisModelRanking(axes[1]).state).toBe("WITHHELD");
    expect(axisModelRanking(axes[2]).state).toBe("NOT_APPLICABLE");
    expect(
      axisModelRanking({
        axis: "safety",
        kind: "model-comparison",
        status: "MEASURED",
        per_model: { model: { n: 0, accuracy: 0.8 } },
      }).state,
    ).toBe("INVALID");
  });

  it("fails closed on a fresh read error and bounds any requested poll interval", () => {
    const html = renderToStaticMarkup(
      <CanonicalGspcBoardView
        data={payload}
        error="/api/gspc answered HTTP 503"
        loading={false}
        refreshing={false}
        observedAt="2026-09-05T03:17:22.123Z"
        sourceUrl="/api/gspc"
        onRefresh={() => {}}
      />,
    );
    expect(html).toContain("UNREACHABLE");
    expect(html).toContain("No cached figures are shown as live");
    expect(html).not.toContain("94.4%");
    expect(boundedGspcPollMs(1)).toBe(MIN_GSPC_POLL_MS);
    expect(boundedGspcPollMs(60_000)).toBe(60_000);
    expect(boundedGspcPollMs(999_999)).toBe(MAX_GSPC_POLL_MS);
    expect(boundedGspcPollMs(0)).toBeNull();
  });

  it("keeps the homepage entry point as a thin canonical-board adapter", () => {
    const html = renderToStaticMarkup(
      <LiveLeaderboard
        heading="The living board"
        defaultExpanded
        showHumanPanel={false}
      />,
    );
    expect(html).toContain('data-testid="canonical-gspc-board"');
    expect(html).toContain("The living board");
    expect(html).toContain("Reading GET /api/gspc");
  });
});
