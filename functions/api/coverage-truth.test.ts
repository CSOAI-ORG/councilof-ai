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
      // measured is a number when derivable, null when it is NOT derivable —
      // never a measured-looking 0 for "we could not compute this".
      expect(s.measured === null || typeof s.measured === "number").toBe(true);
    }
  });

  // Regression guard for the 2026-10-07 fix. The previous check compared
  // card_index rows against root.card_count (335 === 319), two SEPARATE_CORPORA
  // with zero identifier overlap, so reconciliation_ok was permanently false
  // even though each corpus was internally consistent with its own header.
  it("reconciles WITHIN each corpus, never across the two", async () => {
    const { body } = await call();
    // Asserted first: the original implementation returned false here forever
    // (335 index rows === 319 root leaves), so this line alone catches the defect.
    expect(body.summary.reconciliation_ok).toBe(true);

    const rel = body.summary.corpus_relationship;
    expect(rel).toBeDefined();
    expect(rel.relationship).toBe("SEPARATE_CORPORA");
    expect(rel.identifier_overlap).toBe(0);
    expect(rel.root_headers_agree).toBe(true);
    expect(rel.index_headers_agree).toBe(true);
    expect(rel.root_declared_card_count).toBe(rel.root_published_leaves);
    expect(rel.index_declared_n_cards).toBe(rel.index_rows);
    // The two corpora differ in size, and that difference is NOT a failure.
    expect(rel.index_rows).not.toBe(rel.root_published_leaves);
    expect(body.summary.reconciliation_ok).toBe(true);
  });

  it("summary has totals for each lifecycle state", async () => {
    const { body } = await call();
    expect(typeof body.summary.indexed_total).toBe("number");
    expect(typeof body.summary.runnable_total).toBe("number");
    expect(typeof body.summary.measured_total).toBe("number");
    expect(typeof body.summary.signed_total).toBe("number");
  });

  it("reports per-state totals rather than one blended figure", async () => {
    const { body } = await call();
    const surfaces = body.surfaces;
    const indexed = surfaces.reduce((s: number, c: any) => s + (c.indexed ?? 0), 0);
    const measured = surfaces.reduce((s: number, c: any) => s + (c.measured ?? 0), 0);
    const signed = surfaces.reduce((s: number, c: any) => s + (c.signed ?? 0), 0);
    expect(body.summary.indexed_total).toBe(indexed);
    expect(body.summary.measured_total).toBe(measured);
    expect(body.summary.signed_total).toBe(signed);
    // A blended sum would be strictly larger than any single state total.
    expect(indexed + measured + signed).toBeGreaterThan(signed);
    expect(signed).toBeGreaterThan(0);
  });

  it("includes the signed-cards surface with count > 0", async () => {
    const { body } = await call();
    const signed = body.surfaces.find((s: any) => s.surface.startsWith("signed-cards"));
    expect(signed).toBeDefined();
    expect(signed.indexed).toBeGreaterThan(0);
    // Root leaves are a distinct corpus, published separately from indexed rows.
    expect(signed.signed).toBeGreaterThan(0);
  });
});
