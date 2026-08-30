import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATTACH_ROWS,
  attachThatWriteMeasured,
  HF_RECORD,
  joinedPins,
  REG_OBSERVE,
  TWO_SPEED_LANES,
  TWO_SPEED_RULING,
} from "./twoSpeed";

const tools = readFileSync(resolve(__dirname, "../pages/ToolsPage.tsx"), "utf8");

describe("Two-speed GSPC", () => {
  it("censuses without weights and runs only unique lineages", () => {
    expect(TWO_SPEED_RULING).toMatch(/without downloading weights/);
    expect(TWO_SPEED_LANES).toHaveLength(2);
    expect(TWO_SPEED_LANES[0].never).toMatch(/MEASURED/);
    expect(TWO_SPEED_LANES[1].never).toMatch(/quant|:latest/i);
    expect(attachThatWriteMeasured()).toHaveLength(1);
    expect(attachThatWriteMeasured()[0].id).toBe("gspc-cell");
    expect(ATTACH_ROWS.filter((r) => r.write === "never-measured").length).toBeGreaterThanOrEqual(5);
    expect(ATTACH_ROWS.some((r) => r.id === "scitt" && r.write === "never-measured")).toBe(true);
    expect(ATTACH_ROWS.some((r) => r.id === "owasp-crosswalk" && /fused/i.test(r.never))).toBe(true);
    expect(ATTACH_ROWS.some((r) => r.id === "microsoft-ccf" && r.write === "never-measured")).toBe(true);
    expect(ATTACH_ROWS.some((r) => r.id === "ailuminate" && r.write === "never-measured")).toBe(true);
    expect(ATTACH_ROWS.some((r) => r.id === "pyrit" && /Keyword-refusal/i.test(r.never))).toBe(true);
    expect(ATTACH_ROWS.some((r) => r.id === "promptfoo" && r.write === "never-measured")).toBe(true);
  });

  it("keeps Article 50 off weights and the Hub corpus honest", () => {
    expect(REG_OBSERVE.art50_boundary).toMatch(/deployed system/);
    expect(REG_OBSERVE.plugin_never).toMatch(/weights alone/);
    expect(HF_RECORD.filter((r) => r.status === "planted").length).toBeGreaterThanOrEqual(4);
    expect(HF_RECORD.some((r) => r.id === "gspc-results" && r.status === "next")).toBe(true);
    expect(joinedPins().every((p) => p.write === "never-measured")).toBe(true);
    const blob = JSON.stringify({ TWO_SPEED_RULING, ATTACH_ROWS, REG_OBSERVE });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(tools).toContain("TwoSpeed");
  });
});
