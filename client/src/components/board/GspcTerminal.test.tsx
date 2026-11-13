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

  it("renders signed Hugging Face Hub third-party cells inside AxisDrilldown for a model-comparison axis", () => {
    const html = renderToStaticMarkup(
      <AxisDrilldown
        a={{ axis: "safety", kind: "model-comparison", status: "MEASURED", accuracy: 0.944 }}
        elo={EMPTY_ELO}
        cardIndex={EMPTY_CARDS}
        hubCards={{
          state: "ok",
          data: {
            counts: { complete: true, measured: 2 },
            cells: [
              {
                model: "deepseek-ai/DeepSeek-R1",
                axis: "gspc-safety",
                status: "MEASURED",
                accuracy: 0.9167,
                n: 36,
                card_sha256: "sha-dsr1",
                card_url: "/signed/cards/dsr1-safety.json",
                signed: true,
              },
              {
                model: "meta-llama/Llama-3.3-70B-Instruct",
                axis: "gspc-safety",
                status: "MEASURED",
                accuracy: 0.8889,
                n: 36,
                card_sha256: "sha-llama",
                card_url: "/signed/cards/llama-safety.json",
                signed: true,
              },
            ],
          },
        }}
      />,
    );
    expect(html).toContain("Hugging Face Hub third-party cells (2 signed on this axis");
    expect(html).toContain("deepseek-ai/DeepSeek-R1");
    expect(html).toContain("meta-llama/Llama-3.3-70B-Instruct");
    expect(html).toContain("/dashboard?tab=leaderboard#hub-and-mill-cohorts");
  });
});
