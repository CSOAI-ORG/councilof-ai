import { describe, expect, it } from "vitest";
import {
  INDICES_FIREWALL,
  LABOUR_ECONOMY_INDICES,
  getLabourEconomyIndex,
} from "./labourIndices";

describe("labourIndices", () => {
  it("declares exactly three UNMEASURED indices", () => {
    expect(LABOUR_ECONOMY_INDICES).toHaveLength(3);
    expect(LABOUR_ECONOMY_INDICES.every((i) => i.status === "UNMEASURED")).toBe(true);
  });

  it("keeps every index on /indices and UNMEASURED", () => {
    for (const i of LABOUR_ECONOMY_INDICES) {
      expect(i.path).toMatch(/^\/indices\//);
      expect(i.status).toBe("UNMEASURED");
      expect(i.apiPath).toMatch(/^\/api\/indices\//);
    }
  });

  it("resolves known slugs and rejects unknown", () => {
    expect(getLabourEconomyIndex("ai-economy")?.title).toMatch(/AI Economy/);
    expect(getLabourEconomyIndex("nope")).toBeUndefined();
  });

  it("states the firewall doctrine", () => {
    expect(INDICES_FIREWALL).toMatch(/never as inputs/i);
  });
});
