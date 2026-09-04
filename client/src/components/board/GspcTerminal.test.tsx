import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LobbyBoardPane from "@/components/lobby/LobbyBoardPane";
import {
  AxisDrilldown,
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

  it("does not infer an Elo signature from a content ID", () => {
    expect(eloReferenceEvidence({ content_id: "abcdef1234567890" })).toBe(
      "Elo reference content-addressed unsigned · content_id abcdef1234…",
    );
    expect(
      eloReferenceEvidence({
        content_id: "abcdef1234567890",
        signature: { alg: "Ed25519", pubkey: "public", sig: "signature" },
      }),
    ).toBe("Elo reference Ed25519-signed · content_id abcdef1234…");
  });
});
