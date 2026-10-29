import { describe, expect, it } from "vitest";
import { buildCatalogue, groupFor, toCard } from "./servicesCatalogue";
const url = "https://councilof.ai/api/proof";
const cards = (v: unknown) => buildCatalogue(v).groups.flatMap(g => g.cards);
describe("source coverage and honest price descriptions", () => {
  it.each([null, undefined, false, [], {}, { resources: null }, { resources: "x" }, { resources: [], mode: {} }])("keeps unreadable input distinct from empty: %j", input => {
    const c = buildCatalogue(input); expect(c.coverage).toBe("UNREADABLE"); expect(c.total).toBeNull(); expect(c.displayed).toBe(0);
  });
  it("recognises a readable empty source", () => {
    expect(buildCatalogue({ resources: [] })).toMatchObject({ coverage: "COMPLETE", total: 0, displayed: 0, withheld: 0 });
  });
  it("does not invent free service from missing purpose or amount", () => {
    const c = toCard({ url }, "model-measurement"); expect(c.measures).toBe("Purpose not supplied by the manifest."); expect(c.zeroAmountDeclared).toBe(false); expect(c.measures + c.payLine).not.toMatch(/forever/i);
  });
  it.each([0, "0"])("keeps zero %j as a declared snapshot only", amount => {
    const c = toCard({ url, amount }, "model-measurement"); expect(c.zeroAmountDeclared).toBe(true); expect(c.payLine).toMatch(/declared in this manifest/); expect(c.payLine).not.toMatch(/forever|settles|charges nothing/i);
  });
  it("uses the supplied description without changing its words", () => {
    expect(cards({ resources: [{ url, description: "Source description", note: "Other note" }] })[0].measures).toBe("Source description");
  });
  it("separates a large atomic string from numeric coercion", () => {
    const r = { url, amount: "900719925474099312345" }; expect(cards({ resources: [r] })[0].zeroAmountDeclared).toBe(false); expect(r.amount).toBe("900719925474099312345");
  });
  it.each([null, { url, note: {} }, { url, description: [] }, { url, paid_for: 2 }, { url, amount: -1 }, { url, amount: Number.MAX_SAFE_INTEGER + 1 }, { url, method: {} }, { url, method: null }])("withholds malformed rows, preserves valid siblings: %j", row => {
    const c = buildCatalogue({ resources: [row, { url: "/api/free-door" }] }); expect(c).toMatchObject({ coverage: "PARTIAL", total: 2, displayed: 1, withheld: 1 });
  });
  it("bounds the displayed population", () => { expect(buildCatalogue({ resources: Array.from({ length: 1001 }, () => ({ url })) }).coverage).toBe("UNREADABLE"); });
});
describe("resource identities and first-party navigation", () => {
  it.each(["javascript:alert(1)", "data:text/html,x", "//example.invalid/path", "https://example.invalid/collect", "https://councilof.ai@example.invalid/x", "https://user@councilof.ai/x", "http://councilof.ai/x", "https://councilof.ai:9443/x", "https://councilof.ai\\@example.invalid/x", "/api/proof#fragment"])("withholds an unsupported preview without exposing its href: %s", preview => {
    const c = buildCatalogue({ resources: [{ url, free_preview: preview }] }); expect(c.withheld).toBe(1); expect(c.displayed).toBe(0);
  });
  it("preserves the exact allowed template for the existing preview component", () => {
    const preview = "https://councilof.ai/api/rwa/evidence?asset=<symbol>&preview=1";
    expect(cards({ resources: [{ url, free_preview: preview }] })[0].freePreview).toBe(preview);
  });
  it("does not classify a foreign resource by its familiar path", () => { expect(groupFor("https://example.invalid/api/proof")).toBeNull(); });
  it.each(["/api/proof-of-concept", "/api/request-attestation-other", "/api/free-doorway"])("does not treat path lookalikes as supported routes: %s", path => {
    const c = buildCatalogue({ resources: [{ url: path }] }); expect(c.displayed).toBe(0); expect(c.ungrouped).toEqual([`GET ${path}`]); expect(c.coverage).toBe("PARTIAL");
  });
  it("retains an actual directory-family match", () => { expect(groupFor("/api/receipts/batch?from=x")).toBe("agent-rails"); });
  it("withholds every occurrence of a repeated identity", () => {
    const c = buildCatalogue({ resources: [{ url }, { url, amount: "0" }, { url: "/api/free-door" }] }); expect(c).toMatchObject({ total: 3, displayed: 1, withheld: 2, coverage: "PARTIAL" });
  });
  it("does not use an invalid conflicting duplicate to excuse its first copy", () => {
    expect(buildCatalogue({ resources: [{ url }, { url, note: {} }] })).toMatchObject({ displayed: 0, withheld: 2 });
  });
  it("preserves distinct query and method identities", () => {
    const c = cards({ resources: [{ url: url + "?a=1" }, { url: url + "?a=2" }, { url: url + "?a=1", method: "POST" }] }); expect(new Set(c.map(x => x.id)).size).toBe(3); expect(c[0].displayPath).not.toBe(c[1].displayPath);
  });
  it("reconciles grouped, ungrouped and withheld row counts", () => {
    const c = buildCatalogue({ resources: [{ url }, { url: "/api/new" }, null] }); expect(c.displayed + c.ungrouped.length + c.withheld).toBe(c.total);
  });
  it("supports an explicitly supplied deployment origin without trusting other hosts", () => {
    const c = buildCatalogue({ resources: [{ url: "/api/proof" }, { url }] }, "https://preview.example.invalid"); expect(c).toMatchObject({ displayed: 1, withheld: 1 });
  });
});

it("keeps ungrouped method identities visible and distinct", () => {
  const c = buildCatalogue({ resources: [{ url: "/api/new" }, { url: "/api/new", method: "POST" }] });
  expect(c.ungrouped).toEqual(["GET /api/new", "POST /api/new"]);
});
