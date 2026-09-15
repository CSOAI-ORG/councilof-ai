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
    expect(body.schema).toBe("csoai.coverage-truth/0.1");
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

  it("summary totals reconcile signed card IDs to root card_count", async () => {
    const { body } = await call();
    expect(typeof body.summary.reconciliation_ok).toBe("boolean");
  });

  it("summary has totals for each lifecycle state", async () => {
    const { body } = await call();
    expect(typeof body.summary.indexed_total).toBe("number");
    expect(typeof body.summary.runnable_total).toBe("number");
    expect(typeof body.summary.measured_total).toBe("number");
    expect(typeof body.summary.signed_total).toBe("number");
  });

  it("includes the signed-cards surface with count > 0", async () => {
    const { body } = await call();
    const signed = body.surfaces.find((s: any) => s.surface.startsWith("signed-cards"));
    expect(signed).toBeDefined();
    expect(signed.indexed).toBeGreaterThan(0);
  });
});
