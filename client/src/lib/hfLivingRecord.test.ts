import { describe, expect, it } from "vitest";
import { HF_LIVING_RULING, HF_PLANTED, HF_VIEWERS } from "./hfLivingRecord";

describe("HF living record", () => {
  it("plants the Hub datasets and never stamps hub-queue MEASURED", () => {
    expect(HF_PLANTED.map((r) => r.id)).toEqual([
      "gspc-board",
      "gspc-boards",
      "hub-queue",
      "living-catalog",
      "gspc-gov",
    ]);
    expect(HF_PLANTED.every((r) => r.status === "planted")).toBe(true);
    expect(HF_PLANTED.every((r) => r.href.startsWith("https://huggingface.co/datasets/csoai/"))).toBe(
      true,
    );
    const queue = HF_PLANTED.find((r) => r.id === "hub-queue");
    expect(queue?.role).toMatch(/UNMEASURED/);
    expect(HF_LIVING_RULING).toMatch(/GET \/api\/gspc/);
  });

  it("keeps Hub viewers as links, not a fused grade", () => {
    const blob = JSON.stringify({ HF_LIVING_RULING, HF_PLANTED, HF_VIEWERS });
    expect(HF_VIEWERS.some((v) => /iframe/i.test(v.role))).toBe(true);
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(blob).not.toMatch(/we scored the Hub|hub-queue is MEASURED/i);
  });
});
