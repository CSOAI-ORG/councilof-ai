/**
 * HubResultsPane.test.tsx — the published Hub population, rendered without upgrading it.
 *
 * The fixture is the real shape from GET /api/hub-cards on 2026-09-05, including the
 * part that is easy to render wrongly: an UNMEASURED cell that still carries
 * accuracy 0.7333, n 30 and signed true, held back by "signed-pending-verify".
 *
 * A component that prints that 0.7333 passes a naive test and publishes a pending
 * result as a measurement. That is the failure these tests exist to catch.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const PAYLOAD = {
  schema: "csoai.hub-cards/0.1",
  as_of: "2026-09-05T05:07:09.891Z",
  source: "huggingface.co/datasets/csoai/gspc-hub-cards",
  population: "third-party models on the Hub — NOT the CSOAI fleet",
  honesty: {
    status_is_passed_through:
      "Each row's status is exactly as published. This endpoint never upgrades a cell. A valid signature over a body that says UNMEASURED means the cell is UNMEASURED.",
    not_the_board:
      "These cells are not the 22-axis board. The board is GET /api/gspc; quote totals.public_count.",
    own_fleet_is_elsewhere:
      "GET /api/findings carries the CSOAI fleet, which is a different population and is measured against the same frozen banks.",
    unreachable_is_not_empty: "All published indexes were read.",
  },
  counts: { measured: 629, unmeasured: 70, other: 0, cells: 699, indexes_read: 4, indexes_total: 4 },
  cells: [
    {
      model: "Qwen/Qwen3-8B",
      axis: "affect",
      status: "MEASURED",
      accuracy: 0.7333,
      n: 30,
      card_sha256: "0990f10b08a733d910b71ba1c3f463e21fc634f5a390ebc17fcd27921bd1a556",
      card_url: "https://councilof.ai/interop/mill-cards-signed/signed-affect-0990f10b08a7.json",
      signed: true,
      unmeasured: [],
      index: "INDEX.jsonl",
    },
    {
      // Signed, carries a number, and is NOT a measurement.
      model: "Qwen/Qwen2.5-Coder-32B-Instruct",
      axis: "safety",
      status: "UNMEASURED",
      accuracy: 0.7333,
      n: 30,
      card_sha256: "05e3f2c82a6f687061a00faaacef1ceeb6ca8c98e85831523a8ce69dd5570438",
      card_url: "https://councilof.ai/interop/mill-cards-signed/signed-safety-05e3f2c82a6f.json",
      signed: true,
      unmeasured: ["signed-pending-verify"],
      index: "INDEX-safety.jsonl",
    },
  ],
};

vi.mock("./useHubCards", async () => {
  const actual = await vi.importActual<typeof import("./useHubCards")>("./useHubCards");
  return {
    ...actual,
    useHubCards: () => ({ data: PAYLOAD, error: null, loading: false }),
  };
});

const { default: HubResultsPane } = await import("./HubResultsPane");
const { displayAccuracy } = await import("./useHubCards");

const html = () => renderToStaticMarkup(<HubResultsPane />);

describe("displayAccuracy refuses to promote a pending cell", () => {
  it("returns the figure only when the status is exactly MEASURED", () => {
    expect(displayAccuracy(PAYLOAD.cells[0])).toBe(0.7333);
  });

  it("returns null for an UNMEASURED cell even though it carries a number", () => {
    expect(displayAccuracy(PAYLOAD.cells[1])).toBeNull();
  });

  it("returns null for any status the producer may add later", () => {
    expect(displayAccuracy({ model: "m", axis: "a", status: "DRAFT", accuracy: 0.9 })).toBeNull();
  });
});

describe("HubResultsPane", () => {
  it("shows the measured figure", () => {
    expect(html()).toContain("73.3%");
  });

  it("never prints the UNMEASURED cell's number as a result", () => {
    // Both fixture cells carry 0.7333. Exactly one may appear as a percentage.
    const out = html();
    const asPercent = out.match(/73\.3%/g) ?? [];
    expect(
      asPercent.length,
      "an UNMEASURED cell's accuracy was rendered as a result — that publishes a " +
        "pending card as a measurement",
    ).toBe(1);
    expect(out).toContain("not a measurement");
  });

  it("gives the producer's reason instead of a score", () => {
    expect(html()).toContain("signed-pending-verify");
  });

  it("carries provenance before any number: source, observation date and population", () => {
    const out = html();
    expect(out).toContain("huggingface.co/datasets/csoai/gspc-hub-cards");
    expect(out).toContain("2026-09-05T05:07:09.891Z");
    expect(out).toContain("NOT the CSOAI fleet");
  });

  it("passes the producer's own limits through verbatim rather than paraphrasing", () => {
    const out = html();
    // React escapes text nodes, so compare against the escaped form rather than the
    // raw sentence — an apostrophe becomes &#x27; and would fail a naive match.
    const escape = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    for (const sentence of Object.values(PAYLOAD.honesty)) {
      expect(out).toContain(escape(sentence));
    }
  });

  it("states that signed is not verified", () => {
    expect(html()).toMatch(/signature is not a verification/i);
  });

  it("does not present these cells as the 22-axis board", () => {
    const out = html();
    expect(out).toContain("not the 22-axis board");
    // The board's own totals must not appear here — that would be the silent join.
    expect(out).not.toMatch(/22 axis · 22 measured/);
  });

  it("counts UNMEASURED cells in the open rather than dropping them", () => {
    const out = html();
    expect(out).toContain("70 UNMEASURED");
    expect(out).toContain("Qwen/Qwen2.5-Coder-32B-Instruct");
  });

  it("derives the axis filter from the payload rather than a hardcoded list", async () => {
    const { axesIn, statusesIn } = await import("./useHubCards");
    expect(axesIn(PAYLOAD.cells)).toEqual(["affect", "safety"]);
    expect(statusesIn(PAYLOAD.cells)).toEqual(["MEASURED", "UNMEASURED"]);
  });
});
