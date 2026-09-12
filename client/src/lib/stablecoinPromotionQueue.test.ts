import { describe, expect, it } from "vitest";
import { isStablecoinPromotionQueue } from "./stablecoinPromotionQueue";

const queue = {
  schema: "csoai.stablecoin-promotion-queue/0.1",
  kind: "executable-evidence-backlog",
  writes_board: false,
  population: 2,
  counts: {
    indexed: 2, primary_source_registered: 1, deep_probed: 1, measured: 0,
    signed: 0, rooted: 0, witnessed: 0, anchored: 0, asset_specific_x402_settled: 0,
  },
  next_action_counts: { BUILD_REPRODUCIBLE_CHAIN_MEASUREMENT: 1, REGISTER_PRIMARY_SOURCES: 1 },
  rows: [
    { rank: 1, id: "1", symbol: "A", name: "A", next_action: "BUILD_REPRODUCIBLE_CHAIN_MEASUREMENT" },
    { rank: 2, id: "2", symbol: "B", name: "B", next_action: "REGISTER_PRIMARY_SOURCES" },
  ],
};

describe("stablecoin promotion queue contract", () => {
  it("accepts one complete ordered queue", () => {
    expect(isStablecoinPromotionQueue(queue)).toBe(true);
  });

  it("rejects a truncated or board-writing queue", () => {
    expect(isStablecoinPromotionQueue({ ...queue, rows: queue.rows.slice(0, 1) })).toBe(false);
    expect(isStablecoinPromotionQueue({ ...queue, writes_board: true })).toBe(false);
  });
});
