import cardIndex from "../../public/signed/card_index.json";
import rootJson from "../../public/root.json";
import { describe, expect, it } from "vitest";
import { onRequestGet } from "./coverage-truth";

const call = async () => {
  const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({ env: {}, request: new Request("https://councilof.ai/api/coverage-truth") });
  return { status: res.status, body: await res.json() };
};

describe("/api/coverage-truth — indexed / runnable / measured / signed", () => {
  it("returns the coverage-truth schema", async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.schema).toBe("csoai.coverage-truth/0.2");
    expect(body.endpoint).toBe("/api/coverage-truth");
  });

  it("lists per-surface counts", async () => {
    const { body } = await call();
    expect(Array.isArray(body.surfaces)).toBe(true);
    expect(body.surfaces.length).toBeGreaterThanOrEqual(4);
    for (const s of body.surfaces) {
      expect(typeof s.indexed).toBe("number");
      expect(["string", "object"]).toContain(typeof s.surface);
    }
  });

  it("checks the two artifact sets independently", async () => {
    const { body } = await call();
    expect(body.summary.signed_card_ids_in_index).toBe(cardIndex.cards.length);
    expect(body.summary.card_index_declared_count).toBe(cardIndex.cards.length);
    expect(body.summary.card_index_count_matches).toBe(true);
    expect(body.summary.root_harvest_leaf_count).toBe(rootJson.card_sha256.length);
    expect(body.summary.root_leaf_count_matches).toBe(true);
    expect(body.summary).not.toHaveProperty("root_to_index_delta");
    const root = body.surfaces.find((s: any) => s.surface.startsWith("coverage-harvest leaves"));
    expect(root.indexed).toBe(rootJson.card_sha256.length);
    expect(root.measured).toBeNull();
    expect(root.signed).toBeNull();
  });

  it("does not add unlike units or double count chain measurements as stablecoins", async () => {
    const { body } = await call();
    expect(body.summary.aggregate_state).toBe("NOT_ADDITIVE_DIFFERENT_UNITS");
    expect(body.summary).not.toHaveProperty("indexed_total");
    expect(body.summary).not.toHaveProperty("measured_total");
    expect(typeof body.summary.signed_card_ids_in_index).toBe("number");
    const signed = body.surfaces.find((s: any) => s.surface.startsWith("signed-cards"));
    expect(signed.measured).toBeNull();
    expect(signed.signed).toBe(body.summary.signed_card_ids_in_index);
    const stablecoins = body.surfaces.find((s: any) => s.surface === "stablecoin-universe");
    const chains = body.surfaces.find((s: any) => s.surface.startsWith("coverage-register"));
    expect(stablecoins.measured).toBeNull();
    expect(typeof chains.measured).toBe("number");
  });

  it("includes the signed-cards surface with count > 0", async () => {
    const { body } = await call();
    const signed = body.surfaces.find((s: any) => s.surface.startsWith("signed-cards"));
    expect(signed).toBeDefined();
    expect(signed.indexed).toBeGreaterThan(0);
  });
});
