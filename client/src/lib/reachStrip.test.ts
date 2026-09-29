import { describe, expect, it } from "vitest";
import {
  REACH_LID_FALLBACK,
  REACH_RULING,
  REACH_SURFACES,
  formatDownloads,
} from "./reachStrip";

describe("reach strip — distribution, not authority", () => {
  it("lists the verified printers with honest hrefs", () => {
    const ids = REACH_SURFACES.map((s) => s.id);
    expect(ids).toEqual(["hf", "mcp", "npm", "kaggle", "zenodo"]);
    expect(REACH_SURFACES.find((s) => s.id === "hf")?.href).toBe("https://huggingface.co/csoai");
    expect(REACH_SURFACES.find((s) => s.id === "mcp")?.href).toBe("https://councilof.ai/mcp");
    expect(REACH_SURFACES.find((s) => s.id === "npm")?.href).toContain("csoai-gspc-mcp");
    expect(REACH_SURFACES.find((s) => s.id === "glama")).toBeUndefined();
    expect(REACH_SURFACES.find((s) => s.id === "kaggle")?.href).toContain(
      "csoai-gspc-living-board",
    );
    // 29 Sep 2026: the Zenodo record answers 410; the strip links the status record, never the dead DOI.
    expect(REACH_SURFACES.find((s) => s.id === "zenodo")?.href).toBe("/interop/zenodo-status.json");
    expect(REACH_SURFACES.find((s) => s.id === "zenodo")?.note).toContain("appeal pending");
  });

  it("frames printers + lid, never certification or invented counters in static copy", () => {
    const blob = JSON.stringify({ REACH_RULING, REACH_LID_FALLBACK, REACH_SURFACES });
    expect(REACH_RULING).toMatch(/Printers of the live board/);
    expect(REACH_RULING).toMatch(/GET \/api\/gspc/);
    expect(REACH_LID_FALLBACK).toMatch(/not a certificate/i);
    expect(blob).not.toMatch(/we certify|conformity mark|rank for sale/i);
    expect(blob).not.toMatch(/\b11,?000\b|\b11174\b/);
    expect(REACH_SURFACES.every((s) => !/\d{2,}k downloads/i.test(s.note))).toBe(true);
  });

  it("formats download counts without inventing them", () => {
    expect(formatDownloads(11174)).toMatch(/11/);
  });
});
