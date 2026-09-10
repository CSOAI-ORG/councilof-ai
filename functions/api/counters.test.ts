import { describe, expect, it } from "vitest";
import { onRequestGet } from "./counters";

describe("public counters regulatory inventory", () => {
  it("keeps inventory counts separate from legal and measurement claims", async () => {
    const response = await onRequestGet({} as Parameters<typeof onRequestGet>[0]);
    const body = await response.json() as {
      counters: Array<{ id: string; count: number | null; kind: string; note: string }>;
    };
    const byId = Object.fromEntries(body.counters.map((row) => [row.id, row]));

    expect(byId.frozen_provision_counter).toMatchObject({ count: 417, kind: "catalogued" });
    expect(byId.frozen_provision_counter.note).toContain("unresolved-row");
    expect(byId.regulator_authority_adapters).toMatchObject({ count: 17, kind: "catalogued" });
    expect(byId.crosswalk_assets).toMatchObject({ count: 25, kind: "catalogued" });
    expect(byId.published_crosswalk_regimes).toMatchObject({ count: 4, kind: "catalogued" });
    expect(byId.crosswalk_assets.note).toContain("not a count of equivalent signed legal crosswalks");
  });
});
