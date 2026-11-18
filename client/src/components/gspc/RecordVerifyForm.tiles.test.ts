/**
 * Result tiles at phone width (live /gspc-verify/, 390 px, 18 Nov 2026). Each value sat in a
 * 101 px cell as font-mono text-lg with [overflow-wrap:anywhere], so long ids broke letter by
 * letter: "qwen2.5-0.5b-mined:latest" over 4 lines, "sov6-relationality-v3-light:latest" over 5,
 * and even "2026-08-19" over 2.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { tileLayout, verifyTiles } from "./RecordVerifyForm";

const source = readFileSync(new URL("./RecordVerifyForm.tsx", import.meta.url), "utf8");

describe("a checked record's tiles at phone width", () => {
  it("gives the model and test ids the full row, broken only where a word may break", () => {
    for (const label of ["Model", "Test"]) {
      expect(tileLayout(label)).toEqual({ tile: "col-span-full", value: "[overflow-wrap:break-word]" });
    }
  });

  it("never wraps the date, and keeps the short tiles in the grid", () => {
    const labels = verifyTiles(
      { model: "sov6-relationality-v3-light:latest", axis: "mmlu-30", accuracy: "0.7", created: "2026-08-19", own: true },
      "7/7",
    ).map((t) => t.label);
    // The layout is keyed by these labels, so a renamed tile would silently lose its rule.
    expect(labels).toEqual(["Checks passed", "Model", "Test", "Score", "Recorded"]);
    expect(tileLayout("Recorded")).toEqual({ tile: "", value: "whitespace-nowrap" });
    expect(tileLayout("Checks passed").tile).toBe("");
    expect(tileLayout("Score").tile).toBe("");
  });

  it("sets every value one size smaller, with its own tile's breaking rule", () => {
    const dl = source.slice(source.indexOf('data-testid="record-tiles"'), source.indexOf("</dl>"));
    expect(dl).toContain("const fit = tileLayout(t.label);");
    expect(dl).toContain("${fit.tile}");
    expect(dl).toContain("<dd className={`font-mono text-base font-bold leading-tight ${fit.value} ");
    expect(dl).not.toContain("text-lg");
    expect(dl).not.toMatch(/<dd[^\n]*overflow-wrap:anywhere/);
  });
});
