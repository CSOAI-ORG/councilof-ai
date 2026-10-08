import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import LiveBoardGlance, {
  axisMetric,
  boardTiles,
  datasetHref,
  evidenceHref,
  measurementDate,
  modelsHeadline,
  separationRead,
} from "./LiveBoardGlance";
import HomeEvidencePaths from "./HomeEvidencePaths";
import type { GspcPayload } from "../board/useGspcBoard";
const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<Router ssrPath="/">{node}</Router>);
const payload = (rows: any[], totals: any = {}): GspcPayload => ({
  schema: "csoai.gspc-axes/0.5",
  axes: rows,
  totals,
});
const tile = (row: any) => boardTiles(payload([row]))[0];
describe("homepage evidence explorer", () => {
  it("rejects missing, fractional, negative and contradictory separation denominators", () => {
    const good = {
      comparison_axes: 14,
      separated_leads: 0,
      ties: 7,
      untested_separations: 7,
    };
    expect(separationRead(payload([], good))).toEqual({
      comparison: 14,
      separated: 0,
      ties: 7,
      untested: 7,
    });
    for (const changed of [
      { ties: undefined },
      { ties: 8 },
      { comparison_axes: 14.5 },
      { untested_separations: -1 },
    ]) {
      expect(separationRead(payload([], { ...good, ...changed }))).toBeNull();
    }
  });
  it("keeps future declared slots and unknown states visible without awarding metrics", () => {
    const declared = tile({
      axis: "future",
      kind: "declared-slot",
      status: "UNMEASURED",
      accuracy: 1,
    });
    expect(declared).toMatchObject({
      group: "declared",
      state: "UNMEASURED",
      n: null,
    });
    expect(axisMetric(declared)).toBeNull();
    const unknown = tile({
      axis: "future",
      kind: "model-comparison",
      status: "MEASURED",
      separation: "WIN",
      accuracy: 1,
    });
    expect(unknown.state).toBe("UNKNOWN");
    expect(axisMetric(unknown)).toBeNull();
  });
  it("does not turn factual coverage or a sample count into accuracy", () => {
    const facts = tile({
      axis: "facts",
      kind: "deterministic-facts",
      status: "MEASURED",
      n: 261,
      accuracy: 1,
    });
    expect(axisMetric(facts)).toBeNull();
    expect(
      axisMetric(
        tile({ ...facts.row, coverage: "6 of 16 public disclosures" }),
      ),
    ).toEqual({
      label: "Published coverage",
      value: "6 of 16 public disclosures",
    });
  });
  it("does not promote an excluded own or uncarded top observation into accuracy", () => {
    for (const public_leader_state of [
      "EXCLUDED_OWN_MODEL",
      "NO_SIGNED_CARD",
    ]) {
      expect(
        axisMetric(
          tile({
            axis: "x",
            kind: "model-comparison",
            status: "MEASURED",
            separation: "TIE",
            accuracy: 1,
            public_leader_state,
          }),
        ),
      ).toBeNull();
    }
    expect(
      axisMetric(
        tile({
          axis: "x",
          kind: "model-comparison",
          status: "MEASURED",
          separation: "TIE",
          fleet_mean: 0.2,
          public_leader_state: "EXCLUDED_OWN_MODEL",
        }),
      ),
    ).toEqual({ label: "Fleet mean", value: "20.0%" });
  });
  it.each([0, 1])(
    "retains a boundary percentage %s without rejecting zero",
    (accuracy) => {
      expect(
        axisMetric(
          tile({
            axis: "x",
            kind: "model-comparison",
            status: "MEASURED",
            separation: "UNTESTED",
            accuracy,
          }),
        ),
      ).toEqual({
        label: "Top observed score",
        value: (accuracy * 100).toFixed(1) + "%",
      });
    },
  );
  it.each([-1, 1.1, NaN, Infinity, "0.5"])(
    "does not display an invalid percentage %s",
    (accuracy) => {
      expect(
        axisMetric(
          tile({
            axis: "x",
            kind: "model-comparison",
            status: "MEASURED",
            separation: "TIE",
            accuracy,
          }),
        ),
      ).toBeNull();
    },
  );
  it.each([
    "javascript:alert(1)",
    "//other.example/run",
    "http://other.example/run",
    "data:text/html,x",
    "/a\\b",
    "/a\nb",
    " https://example.com/run",
  ])("rejects unsafe evidence URL %s", (url) => {
    expect(evidenceHref(url)).toBeNull();
  });
  it("follows only supplied evidence URLs and preserves missing run evidence", () => {
    expect(evidenceHref("/signed/run.json")).toBe("/signed/run.json");
    expect(evidenceHref("https://example.org/run.json")).toBe(
      "https://example.org/run.json",
    );
    const html = render(
      <LiveBoardGlance
        data={payload([
          {
            axis: "alpha",
            kind: "model-comparison",
            status: "MEASURED",
            separation: "TIE",
            n: 12,
          },
        ])}
        models={null}
      />,
    );
    expect(html).toContain("No run link published on this row");
    expect(html).not.toContain("/signed/alpha.json");
    expect(html).toContain('aria-controls="gspc-axis-detail"');
    expect(html).toContain('id="gspc-axis-detail"');
    expect(html).toContain('id="gspc-detail-title" tabindex="-1"');
  });
  it("preserves exact, day and not-after measurement precision rather than a fetch date", () => {
    expect(
      measurementDate({
        axis: "a",
        measurement_time: { observed_at: "2026-08-18T03:22:16Z" },
      }),
    ).toBe("2026-08-18T03:22:16Z · exact time");
    expect(
      measurementDate({
        axis: "a",
        measurement_time: { observed_on: "2026-08-12" },
      }),
    ).toBe("2026-08-12 · day precision");
    expect(
      measurementDate({
        axis: "a",
        measurement_time: { not_after: "2026-08-19T09:24:39Z" },
      }),
    ).toBe("No later than 2026-08-19T09:24:39Z");
    expect(measurementDate({ axis: "a" })).toBe(
      "Date not published on this row",
    );
  });
  it("keeps an unmeasured factual slot from claiming a completed run", () => {
    const html = render(
      <LiveBoardGlance
        data={payload([
          {
            axis: "later-facts",
            kind: "deterministic-facts",
            status: "UNMEASURED",
          },
        ])}
        models={null}
      />,
    );
    expect(html).toContain("This declared slot has no measured result.");
    expect(html).not.toContain("A deterministic rule reads public records.");
  });
  it("validates both included and excluded census counts against their own row kinds", () => {
    const doc = {
      schema: "csoai.models-measured/0.1",
      headline: { third_party_models: 2, own_models_excluded: 1 },
      models: [
        { kind: "third_party" },
        { kind: "third_party" },
        { kind: "own" },
        { kind: "own_unconfirmed" },
      ],
    };
    expect(modelsHeadline(doc)).toEqual({
      third_party_models: 2,
      own_models_excluded: 1,
    });
    expect(
      modelsHeadline({
        ...doc,
        headline: { ...doc.headline, own_models_excluded: 2 },
      }),
    ).toBeNull();
    expect(
      modelsHeadline({
        ...doc,
        headline: { ...doc.headline, own_models_excluded: -1 },
      }),
    ).toBeNull();
  });
  it("has distinct evidence routes without presenting facts as model winners", () => {
    const html = render(<HomeEvidencePaths />);
    for (const href of [
      "/board/models",
      "/gspc/effect-binding",
      "/financial-axes",
    ])
      expect(html).toContain('href="' + href + '"');
    expect(html).not.toMatch(/certified|trading signal|best investment/i);
  });
});

describe("evidence source labels", () => {
  const panel = (kind: string, dataset: string) =>
    render(
      <LiveBoardGlance
        data={payload([
          {
            axis: "test-source",
            kind,
            status: kind === "declared-slot" ? "UNMEASURED" : "MEASURED",
            separation: "TIE",
            dataset,
          },
        ])}
        models={null}
      />,
    );
  it("distinguishes question banks from public fact and declared-slot data links", () => {
    expect(panel("model-comparison", "https://example.org/source")).toContain(
      "Open the question bank",
    );
    for (const kind of ["deterministic-facts", "declared-slot"]) {
      const html = panel(kind, "https://example.org/source");
      expect(html).toContain("Open published data");
      expect(html).not.toContain("Open the question bank");
    }
  });
  it("keeps plain source identifiers scoped to the instrument type", () => {
    expect(panel("model-comparison", "bank-identifier")).toContain("Bank:");
    for (const kind of ["deterministic-facts", "declared-slot"]) {
      const html = panel(kind, "source-identifier");
      expect(html).toContain("Source:");
      expect(html).not.toContain("Bank:");
    }
  });
});

describe("producer supplied evidence links", () => {
  it("prefers the resolved dataset URL and never fabricates one from a slug", () => {
    expect(
      datasetHref({
        axis: "governance",
        dataset: "csoai/GovBench",
        dataset_url: "https://huggingface.co/datasets/csoai/GovBench",
      }),
    ).toBe("https://huggingface.co/datasets/csoai/GovBench");
    expect(
      datasetHref({ axis: "governance", dataset: "csoai/GovBench" }),
    ).toBeNull();
    expect(
      datasetHref({ axis: "legacy", dataset: "https://example.org/legacy" }),
    ).toBe("https://example.org/legacy");
  });
  it("preserves an explicit unresolved or unsafe producer URL rather than bypassing it", () => {
    for (const row of [
      { dataset_url: null },
      { dataset_url: "javascript:alert(1)" },
      {
        dataset_url_state: "UNRESOLVABLE",
        dataset_url: "https://example.org/source",
      },
    ])
      expect(
        datasetHref({
          axis: "source",
          dataset: "https://example.org/raw",
          ...row,
        }),
      ).toBeNull();
  });
  it("renders the supplied bank link and a separately labelled public model card", () => {
    const html = render(
      <LiveBoardGlance
        data={payload([
          {
            axis: "governance",
            kind: "model-comparison",
            status: "MEASURED",
            separation: "TIE",
            dataset: "csoai/GovBench",
            dataset_url: "https://huggingface.co/datasets/csoai/GovBench",
            leader_card_url: "/cards/public-model.json",
          },
        ])}
        models={null}
      />,
    );
    expect(html).toContain(
      'href="https://huggingface.co/datasets/csoai/GovBench"',
    );
    expect(html).toContain('href="/cards/public-model.json"');
    expect(html).toContain("Inspect public model card");
    expect(html).toContain("Run attestation not declared");
    expect(html).toContain("No run link published on this row");
  });
  it("keeps the source's unresolved dataset state visible without a guessed bank link", () => {
    const html = render(
      <LiveBoardGlance
        data={payload([
          {
            axis: "jail",
            kind: "model-comparison",
            status: "MEASURED",
            separation: "UNTESTED",
            dataset: "published: csoai/goldbank",
            dataset_url: null,
            dataset_url_state: "UNRESOLVABLE",
          },
        ])}
        models={null}
      />,
    );
    expect(html).toContain("Source marks the dataset URL unresolved");
    expect(html).toContain("published: csoai/goldbank");
    expect(html).not.toContain("https://huggingface.co/datasets/published");
  });
});

describe("deterministic server-probe method scope", () => {
  it("shows Effect Binding's server task without describing it as a public-record read", () => {
    const html = render(
      <LiveBoardGlance
        data={payload([{
          axis: "effect-binding", family: "gspc", kind: "deterministic-facts",
          status: "MEASURED", bench: "EffectBench v0.1 (server probe)",
          task: "does authorization bind to the request the server executes, or only to the tool call the agent declared",
          n: 261, n_unit: "tool-call servers probed",
          facts_as_of: "2026-09-22T05:43:05Z",
          evidence_url: "/interop/effect-binding-server-probe-2026-09-22.signed.json",
        }], { axes: 1, measured_axes: 1, fact_runs: 1 })}
        models={null}
      />,
    );
    expect(html).toContain("tool-call servers probed");
    expect(html).toContain("server probe");
    expect(html).toContain("does authorization bind to the request the server executes");
    expect(html).toContain('href="/interop/effect-binding-server-probe-2026-09-22.signed.json"');
    expect(html).not.toContain("A deterministic rule reads public records");
    expect(html).not.toContain("Records checked by rules");
    expect(html).toContain("Deterministic instrument checks");
    expect(html).toContain("This run has no model ranking or separation test.");
  });
});
