import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LobbyBoardPane from "@/components/lobby/LobbyBoardPane";
import {
  AxisDrilldown,
  TerminalHeadLines,
  axisRunEvidence,
  eloReferenceEvidence,
} from "./GspcTerminal";

const EMPTY_ELO = { state: "ok" as const, data: { per_axis: {} } };
const EMPTY_CARDS = { state: "ok" as const, data: { cards: [] } };

describe("canonical GSPC terminal evidence truth", () => {
  it("describes the two axis evidence families without promising every row a signed ranking", () => {
    const html = renderToStaticMarkup(<LobbyBoardPane />);
    expect(html).toContain(
      "model-comparison axes may have signed cards and rankings",
    );
    expect(html).toContain(
      "deterministic-facts axes link their own run artifacts",
    );
    expect(html).not.toContain(
      "Click a row to open the signed per-model ranking",
    );
  });

  it("labels content-addressed bytes as unsigned and links the actual run", () => {
    const axis = {
      axis: "reserve-attestation",
      kind: "deterministic-facts",
      status: "MEASURED",
      run_attestation: "CONTENT_ADDRESSED_UNSIGNED" as const,
      evidence_url: "/interop/financial-measure-run-reserve-attestation.json",
    };
    expect(axisRunEvidence(axis)).toMatchObject({
      label: "Content-addressed unsigned run",
      href: axis.evidence_url,
    });

    const html = renderToStaticMarkup(
      <AxisDrilldown a={axis} elo={EMPTY_ELO} cardIndex={EMPTY_CARDS} />,
    );
    expect(html).toContain("Content-addressed unsigned run");
    expect(html).toContain(axis.evidence_url);
    expect(html).toContain("it is not a signature");
    expect(html).not.toContain("Verify signed card");
  });

  it("labels an explicitly signed fact run without offering card verification", () => {
    const axis = {
      axis: "provenance-controls",
      kind: "deterministic-facts",
      status: "MEASURED",
      run_attestation: "ED25519_SIGNED" as const,
      evidence_url: "/interop/financial-measure-run-v2.json",
    };
    const coincidentalCard = {
      state: "ok" as const,
      data: {
        cards: [
          {
            axis: "provenance-controls",
            card_url: "/signed/cards/provenance-controls.json",
            signed: true,
          },
        ],
      },
    };
    const html = renderToStaticMarkup(
      <AxisDrilldown a={axis} elo={EMPTY_ELO} cardIndex={coincidentalCard} />,
    );
    expect(html).toContain("Ed25519-signed run");
    expect(html).toContain("declares an Ed25519 signature");
    expect(html).not.toContain("Verify signed card");
  });

  it("offers card verification for a model-comparison axis only when cards exist", () => {
    const model = {
      axis: "safety",
      kind: "model-comparison",
      status: "MEASURED",
      accuracy: 0.9,
      separation: "TIE",
    };
    const withCard = {
      state: "ok" as const,
      data: {
        cards: [
          {
            axis: "gspc-safety",
            card_url: "/signed/cards/safety.json",
            signed: true,
          },
        ],
      },
    };
    const withCardHtml = renderToStaticMarkup(
      <AxisDrilldown a={model} elo={EMPTY_ELO} cardIndex={withCard} />,
    );
    const noCardHtml = renderToStaticMarkup(
      <AxisDrilldown a={model} elo={EMPTY_ELO} cardIndex={EMPTY_CARDS} />,
    );
    const unsignedCardHtml = renderToStaticMarkup(
      <AxisDrilldown
        a={model}
        elo={EMPTY_ELO}
        cardIndex={{ state: "ok", data: { cards: [{ axis: "gspc-safety", signed: false }] } }}
      />,
    );
    expect(withCardHtml).toContain("Verify signed card");
    expect(noCardHtml).not.toContain("Verify signed card");
    expect(unsignedCardHtml).not.toContain("Verify signed card");
  });

  it("does not infer an attestation state from an evidence URL", () => {
    expect(
      axisRunEvidence({
        axis: "future-fact",
        evidence_url: "/interop/future.json",
      }),
    ).toEqual({
      href: "/interop/future.json",
      label: "Run artifact",
      detail: "No run-attestation state was declared.",
    });
  });

  it("fails closed visibly when a measured facts row has no run artifact", () => {
    const html = renderToStaticMarkup(
      <AxisDrilldown
        a={{ axis: "future-fact", kind: "deterministic-facts", status: "MEASURED" }}
        elo={EMPTY_ELO}
        cardIndex={EMPTY_CARDS}
      />,
    );
    expect(html).toContain("No run artifact published.");
    expect(html).not.toContain("Verify signed card");
  });

  it("does not label rendered Elo rows signed from a content ID alone", () => {
    const html = renderToStaticMarkup(
      <AxisDrilldown
        a={{ axis: "safety", kind: "model-comparison", status: "MEASURED", accuracy: 0.9 }}
        elo={{
          state: "ok",
          data: {
            content_id: "abcdef1234567890",
            per_axis: {
              safety: [{ model: "example/model", elo: 1000, winrate: 0.5, games: 10 }],
            },
          },
        }}
        cardIndex={EMPTY_CARDS}
      />,
    );
    expect(html).toContain("Arena content-addressed unsigned");
    expect(html).not.toContain("signed Elo reference");
    expect(html).not.toContain("Arena Ed25519 signature present");
  });

  it("does not infer an Elo signature from a content ID", () => {
    expect(eloReferenceEvidence({ content_id: "abcdef1234567890" })).toBe(
      "Arena content-addressed unsigned · content_id abcdef1234…",
    );
    expect(
      eloReferenceEvidence({
        content_id: "abcdef1234567890",
        signature: { alg: "Ed25519", pubkey: "public", sig: "signature" },
      }),
    ).toBe("Arena Ed25519 signature present, unchecked · content_id abcdef1234…");
    expect(
      eloReferenceEvidence({
        content_id: "abcdef1234567890",
        signature: { alg: "Ed25519", did: "did:web:csoai.org#board-attestation-1", envelope: { content_id: "abcdef1234567890" }, sig_ed25519: "ab".repeat(64) },
      }),
    ).toBe("Arena Ed25519 signature present, unchecked · content_id abcdef1234…");
  });
});

/**
 * The mined UX/UI adoption, pinned.
 *
 *  · The FOLD: the terminal's first lines answer "is anything separated?", not only
 *    "how many are measured". A run behind a slot is not a measured advantage.
 *  · The NUMBER CARRIES ITS METHOD: a measured row shows the resolution (the smallest
 *    lead the axis could detect), the separation sentence, the measured-on day and its
 *    precision, the leader card's state, and the rows file the number came from.
 *  · ABSENT IS NOT ZERO: an axis with no MDE shows no resolution line — never 0.
 */
describe("GSPC terminal: the fold and the number's own method", () => {
  const SEPARATION_LINE = "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED";

  it("puts the separation line under the count so the fold answers the real question", () => {
    const html = renderToStaticMarkup(
      <TerminalHeadLines
        state="ok"
        totals={{ public_count: "33 axes · 23 measured", separation_public_count: SEPARATION_LINE }}
      />,
    );
    expect(html).toContain("33 axes · 23 measured");
    expect(html).toContain(SEPARATION_LINE);
    expect(html).toContain('data-testid="terminal-separation-line"');
  });

  it("drops the separation line when the board publishes none — never a typed zero", () => {
    const html = renderToStaticMarkup(
      <TerminalHeadLines state="ok" totals={{ public_count: "33 axes · 23 measured" }} />,
    );
    expect(html).toContain("33 axes · 23 measured");
    expect(html).not.toContain('data-testid="terminal-separation-line"');
    expect(html).not.toContain("0 of 0");
  });

  it("shows no separation line while the board is unread", () => {
    const html = renderToStaticMarkup(
      <TerminalHeadLines state="error" totals={{ separation_public_count: SEPARATION_LINE }} />,
    );
    expect(html).toContain("UNREACHABLE");
    expect(html).not.toContain(SEPARATION_LINE);
  });

  const MEASURED = {
    axis: "governance",
    kind: "model-comparison",
    status: "MEASURED",
    accuracy: 0.5865,
    interval: [0.523, 0.647],
    fleet_mean: 0.49,
    separation: "TIE",
    separation_p: 0.3787,
    separation_sentence:
      "No model separated from the next best on this axis (exact McNemar, p≥0.05, n=237; p=0.3787).",
    mde: {
      value: 0.138,
      state: "MEASURED",
      unit: "accuracy difference (proportion), leader minus the best base model",
      alpha: 0.05,
      power: 0.8,
    },
    measurement_time: {
      state: "DAY",
      precision: "day",
      observed_on: "2026-08-12",
      note: "The source publishes day precision only. No midnight timestamp is invented.",
    },
    leader_card_state: "CARD_RECORDS_A_DIFFERENT_MEASUREMENT",
    peritem_file_sha256: "3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbfa2a5",
  };

  it("carries the resolution, the separation sentence, the day, the card state and the rows sha", () => {
    const html = renderToStaticMarkup(
      <AxisDrilldown a={MEASURED} elo={EMPTY_ELO} cardIndex={EMPTY_CARDS} />,
    );
    expect(html).toContain('data-testid="axis-method"');
    expect(html).toContain("How this number was made");
    // Resolution — the smallest lead this axis could detect.
    expect(html).toContain("0.138");
    expect(html).toContain("or more is what this axis could detect");
    expect(html).toContain("alpha 0.05");
    expect(html).toContain("power 0.8");
    // Separation — the board's own sentence, verbatim.
    expect(html).toContain(MEASURED.separation_sentence);
    // Measured on — the day and the precision the source published.
    expect(html).toContain("2026-08-12");
    expect(html).toContain("day precision");
    expect(html).toContain("No midnight timestamp is invented");
    // Leader card — a card that records a DIFFERENT measurement does not back the number.
    expect(html).toContain("DIFFERENT measurement");
    expect(html).toContain("does not back the number shown");
    // Rows — the file the number was computed from.
    expect(html).toContain("3a1d3193d3651448…");
  });

  it("shows no method block for an axis the board publishes no method for", () => {
    const html = renderToStaticMarkup(
      <AxisDrilldown
        a={{ axis: "future-slot", kind: "declared-slot", status: "UNMEASURED" }}
        elo={EMPTY_ELO}
        cardIndex={EMPTY_CARDS}
      />,
    );
    expect(html).not.toContain('data-testid="axis-method"');
  });

  it("never prints a zero resolution for an axis with no MDE", () => {
    const html = renderToStaticMarkup(
      <AxisDrilldown
        a={{ axis: "safety", kind: "model-comparison", status: "MEASURED", accuracy: 0.9, separation: "TIE" }}
        elo={EMPTY_ELO}
        cardIndex={EMPTY_CARDS}
      />,
    );
    expect(html).not.toContain('data-testid="axis-method"');
    expect(html).not.toContain("Resolution");
  });
});
