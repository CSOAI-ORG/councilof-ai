import { describe, expect, it } from "vitest";
import { previewFields, resolvePreview } from "./previewTemplate";
const base = "https://councilof.ai/api/art50/marking-evidence";
const urlTemplate = `${base}?url=<https://…>&preview=1`;
const assetTemplate = "https://councilof.ai/api/rwa/evidence?asset=<symbol>&preview=1";

describe("complete preview placeholders", () => {
  it("recognises the retained URL-shaped hint", () => {
    expect(previewFields(urlTemplate)).toEqual([{ key: "url", hint: "https://…" }]);
    expect(resolvePreview(urlTemplate, {})).toBeNull();
  });
  it("recognises encoded URL-shaped hints", () => {
    expect(previewFields(urlTemplate.replace("<https://…>", "%3Chttps%3A%2F%2F%E2%80%A6%3E"))).toEqual(previewFields(urlTemplate));
  });
  it("requires every complete query-value placeholder", () => {
    const t = "https://councilof.ai/api/receipts/batch?from=<iso>&to=<iso>&preview=1";
    expect(resolvePreview(t, { from: "2026-09-01" })).toBeNull();
    const u = new URL(resolvePreview(t, { from: "2026-09-01", to: "2026-09-18" })!);
    expect(u.searchParams.get("from")).toBe("2026-09-01");
    expect(u.searchParams.get("to")).toBe("2026-09-18");
  });
  it("preserves a nested URL as one value, without changing fixed flags", () => {
    const value = "https://example.invalid/public?q=x&preview=0#section";
    const u = new URL(resolvePreview(urlTemplate, { url: value })!);
    expect(u.searchParams.get("url")).toBe(value);
    expect(u.searchParams.get("preview")).toBe("1");
    expect(u.hash).toBe("");
  });
});
describe("unsupported templates stay unlinked", () => {
  it.each([
    "https://[", "javascript:alert(1)", "https://example.invalid/api/preview?preview=1",
    "//councilof.ai/api/preview?preview=1", "https://name@councilof.ai/api/preview?preview=1",
    `${base}?url=prefix-<https://…>&preview=1`, `${base}?url=<>&preview=1`,
    `${base}?url=<nested<hint>>&preview=1`, `${base}?url=<https://…`,
    "https://councilof.ai/api/<path>?preview=1", `${base}?<key>=value&preview=1`,
    `${base}?url=%ZZ&preview=1`, `${base}?url=x#fragment`,
    `${base}?url=<https://…>&url=FIXED&preview=1`,
    `${base}?url=<https://…>&preview=1&preview=0`,
    `${base}?url=<https://…>&preview=<flag>`,
  ])("does not expose or throw for %s", (t) => {
    expect(() => previewFields(t)).not.toThrow();
    expect(previewFields(t)).toEqual([]);
    expect(resolvePreview(t, { url: "https://example.invalid/public", key: "value", flag: "1" })).toBeNull();
  });
  it("withholds ambiguous duplicate fields rather than deleting fixed values", () => {
    expect(resolvePreview(`${assetTemplate}&asset=LOCKED`, { asset: "RLUSD" })).toBeNull();
  });
  it("rejects an oversized template", () => {
    expect(resolvePreview(`${base}?q=${"x".repeat(4097)}`, {})).toBeNull();
  });
  it("limits parameter count", () => {
    expect(resolvePreview(`${base}?${Array.from({length: 51}, (_, i) => `p${i}=x`).join("&")}`, {})).toBeNull();
  });
  it("rejects non-string runtime input instead of throwing", () => {
    expect(resolvePreview(null as unknown as string, {})).toBeNull();
  });
});
describe("value boundaries", () => {
  it.each(["", " ", "<symbol>", "x\ny", "x\u0000y", "x".repeat(2049)])("withholds incomplete or unsupported values %#", value => {
    expect(resolvePreview(assetTemplate, { asset: value })).toBeNull();
  });
  it("rejects a non-string value instead of invoking trim", () => {
    expect(resolvePreview(assetTemplate, { asset: {} } as unknown as Record<string, string>)).toBeNull();
  });
  it("requires an own value rather than an inherited property", () => {
    expect(resolvePreview(assetTemplate, Object.create({ asset: "RLUSD" }))).toBeNull();
  });
  it("preserves Unicode and delimiters as one query value", () => {
    const value = "£ — 🐟 &preview=0#fragment";
    const u = new URL(resolvePreview(assetTemplate, { asset: value })!);
    expect(u.searchParams.get("asset")).toBe(value);
    expect(u.searchParams.get("preview")).toBe("1");
  });
  it("does not accept an unresolved value passed to the URL-shaped field", () => {
    expect(resolvePreview(urlTemplate, { url: "<https://…>" })).toBeNull();
  });
  it("preserves concrete first-party relative templates unchanged", () => {
    const t = "/api/receipts/batch?from=2026-01-01T00%3A00%3A00Z&preview=1";
    expect(resolvePreview(t, {})).toBe(t);
  });
  it("does not substitute unrelated extra values", () => {
    const u = new URL(resolvePreview(assetTemplate, { asset: "RLUSD", preview: "0", other: "secret" })!);
    expect(u.searchParams.get("preview")).toBe("1");
    expect(u.searchParams.has("other")).toBe(false);
  });
});
describe("explicit HTTPS hints and exact input text", () => {
  it.each(["http://example.invalid/public", "javascript:alert(1)", "not a URL", "https://user:password@example.invalid/public"])("rejects unsupported URL input %s", value => {
    expect(resolvePreview(urlTemplate, { url: value })).toBeNull();
  });
  it("does not silently replace an unpaired Unicode surrogate", () => {
    expect(resolvePreview(assetTemplate, { asset: "A\uD800B" })).toBeNull();
  });
  it("limits editable field count", () => {
    expect(resolvePreview(`${base}?${Array.from({length: 21}, (_, i) => `p${i}=<value>`).join("&")}`, {})).toBeNull();
  });
});
