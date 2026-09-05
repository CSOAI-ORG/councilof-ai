import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FREE_TOOLS,
  METERED_TOOLS,
  PUBLISHED_TOOL_COUNT,
} from "./DashboardToolsPane";

describe("dashboard MCP inventory", () => {
  it("matches the runtime's seven free and four paid tools", () => {
    expect(FREE_TOOLS).toEqual([
      "board_totals",
      "get_axis",
      "verify_card",
      "list_cards",
      "get_root",
      "get_card",
      "verify_inclusion",
    ]);
    expect(METERED_TOOLS).toEqual([
      "commission_card",
      "art50_marking_evidence",
      "rwa_evidence",
      "receipts_batch",
    ]);
    expect(PUBLISHED_TOOL_COUNT).toBe(11);
  });

  it("does not advertise the quarantined witness SKU", () => {
    const source = readFileSync(
      resolve(__dirname, "./DashboardToolsPane.tsx"),
      "utf8",
    );
    expect(source).not.toContain('"witness_hash"');
  });
});
