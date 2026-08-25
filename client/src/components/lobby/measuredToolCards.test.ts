import { describe, expect, it } from "vitest";
import {
  MEASURED_TOOL_CARDS,
  cardForTool,
  inferToolFromResult,
} from "./measuredToolCards";

describe("measuredToolCards registry", () => {
  it("covers measured MCP tools and honest UNMEASURED catalogs", () => {
    expect(Object.keys(MEASURED_TOOL_CARDS).sort()).toEqual(
      [
        "benchmark_quality",
        "east_west_board",
        "ecosystem_index",
        "gspc_board",
        "indices_catalog",
        "instruments_catalog",
        "rwa_attestation_catalog",
        "verify_tally",
      ].sort(),
    );
  });

  it("builds a done card for gspc_board", () => {
    const c = cardForTool("gspc_board", { phase: "done", preview: '{"schema":"x"}' });
    expect(c?.path).toBe("/gspc-scoreboard");
    expect(c?.pane).toBe("board");
    expect(c?.preview).toContain("schema");
  });

  it("returns null for unknown tools", () => {
    expect(cardForTool("not_a_tool")).toBeNull();
  });

  it("infers gspc from board-shaped payloads", () => {
    expect(inferToolFromResult({ schema: "csoai.gspc-axes/0.5", axes: [] })).toBe("gspc_board");
  });

  it("infers rwa catalog from schema-shaped payloads", () => {
    expect(
      inferToolFromResult({ schema: "csoai.rwa-attestation-catalog/0.1", targets: [] }),
    ).toBe("rwa_attestation_catalog");
  });
});
