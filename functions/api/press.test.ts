import { describe, expect, it } from "vitest";
import { build } from "./press.json";

const revenueKv = (records: Record<string, unknown>[]) => {
  const store = new Map(records.map((r, i) => [`settled:tx:${i}`, JSON.stringify(r)]));
  return {
    get: async (key: string) => store.get(key) ?? null,
    list: async ({ prefix }: { prefix: string }) => ({
      keys: [...store.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })),
      list_complete: true,
      cursor: "",
    }),
    put: async () => undefined,
  } as unknown as KVNamespace;
};

describe("/api/press.json is derived, and refuses to announce what did not happen", () => {
  it("the window is anchored to artifact dates, never to the clock", async () => {
    const a = await build(), b = await build();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));      // byte-identical across calls
    expect(a.window.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // 7-day window, inclusive of both ends
    const span = (new Date(a.window.to + "T00:00:00Z").getTime() - new Date(a.window.from + "T00:00:00Z").getTime()) / 864e5;
    expect(span).toBe(6);
    // and the anchor is a date some artifact actually carries
    const corrections = a.corrections_this_window;
    expect(corrections.total).toBeGreaterThan(0);
  });

  it("every published line carries a proof command", async () => {
    const d = await build();
    expect(d.window.proof).toContain("curl");
    expect(d.public_root.proof).toContain("curl");
    expect(d.signed_cards.proof).toContain("curl");
    expect(d.corrections_this_window.proof).toContain("curl");
    for (const i of d.corrections_this_window.items) expect(i.proof).toContain(i.id);
    for (const n of d.not_announced) expect(n.proof.length).toBeGreaterThan(10);
  });

  it("corrections in the window all fall inside it", async () => {
    const d = await build();
    for (const i of d.corrections_this_window.items) {
      expect(i.date >= d.window.from).toBe(true);
      expect(i.date <= d.window.to).toBe(true);
    }
    expect(d.corrections_this_window.value).toBe(d.corrections_this_window.items.length);
  });

  it("distribution surfaces publish NULL, never 0, while nothing is confirmed live", async () => {
    const d = await build();
    // The spray log holds drafted/queued rows only. A drafted row is not a placement, and a
    // zero would read as a measured result rather than an absence.
    expect(d.distribution_surfaces.live === null || typeof d.distribution_surfaces.live === "number").toBe(true);
    if (!d.distribution_surfaces.live) {
      expect(d.distribution_surfaces.live).toBeNull();
      expect(d.distribution_surfaces.kind).toBe("unmeasured");
      expect(d.distribution_surfaces.note).toContain("not a published surface");
    }
  });

  it("keeps unavailable settlement evidence uncheckable instead of claiming it did not happen", async () => {
    const d = await build();
    const subjects = d.not_announced.map((n) => n.subject);
    expect(subjects).toContain("first outside settlement status");
    expect(subjects).toContain("N sites live");
    expect(d.commercial_evidence.state).toBe("UNCHECKABLE");
    expect(d.commercial_evidence.outside_settlements).toBeNull();
    expect(d.not_announced.find((n) => n.subject.includes("settlement"))!.state).toBe("UNCHECKABLE");
  });

  it("reports a real outside settlement and removes it from refused claims", async () => {
    const d = await build({
      REVENUE_KV: revenueKv([{
        payer: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        self: false,
        amount_atomic: "20000",
        settled_at: "2026-09-13T08:00:00Z",
        transaction: "0xproof",
      }]),
    });
    expect(d.commercial_evidence).toMatchObject({
      state: "MEASURED",
      outside_payers: 1,
      outside_settlements: 1,
      settled_usdc_atomic: 20000,
    });
    expect(d.not_announced.map((n) => n.subject)).not.toContain("first outside settlement");
    expect(d.faq.find((f) => f.q.includes("NOT measured"))!.a).toContain("1 outside settlement");
  });

  it("states the root's proof scope and the three-corpora boundary", async () => {
    const d = await build();
    expect(d.public_root.scope).toContain("BYTES ONLY");
    expect(d.signed_cards.corpus_note).toContain("zero identifier overlap");
  });
});

describe("the FAQ is answered from artifacts", () => {
  it("every answer is non-trivial and the set is stable across calls", async () => {
    const a = (await build()).faq, b = (await build()).faq;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.length).toBeGreaterThanOrEqual(5);
    for (const f of a) {
      expect(f.q.endsWith("?")).toBe(true);
      expect(f.a.length).toBeGreaterThan(60);
    }
  });

  it("the correction answers carry the REAL count and the REAL newest entry", async () => {
    const d = await build();
    const count = d.faq.find((f) => f.q.includes("corrections"))!.a;
    expect(count).toContain(String(d.corrections_this_window.total));
    const newest = d.faq.find((f) => f.q.includes("most recent thing"))!.a;
    expect(newest).toMatch(/^C-\d{4}-\d{4}-\d{2}/);
    expect(newest).toContain("The fix:");
  });

  it("the not-measured answer refuses to turn absence into a zero", async () => {
    const d = await build();
    const a = d.faq.find((f) => f.q.includes("NOT measured"))!.a;
    expect(a).toContain("UNCHECKABLE");
  });

  it("the certification answer says we do not certify, in the gate's own vocabulary", async () => {
    const a = (await build()).faq.find((f) => f.q.includes("certify"))!.a;
    expect(a).toMatch(/we do not certify/i);
    expect(a).toMatch(/never sold/i);
  });

  it("the root answer states scope and never implies it anchors more", async () => {
    const a = (await build()).faq.find((f) => f.q.includes("public root"))!.a;
    expect(a).toContain("bytes only");
    expect(a).toContain("does not anchor GSPC");
  });
});
