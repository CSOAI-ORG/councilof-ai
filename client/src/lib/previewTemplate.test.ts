import { describe, expect, it } from "vitest";
import { previewFields, resolvePreview } from "./previewTemplate";

const template = "https://councilof.ai/api/rwa/evidence?asset=<symbol>&preview=1";

describe("manifest preview parameters", () => {
  it("requires a real value before exposing the RWA link", () => {
    expect(previewFields(template)).toEqual([{ key: "asset", hint: "symbol" }]);
    for (const asset of ["", "   ", "<symbol>"]) {
      expect(resolvePreview(template, { asset })).toBeNull();
    }
    expect(resolvePreview(template, {})).toBeNull();
    expect(new URL(resolvePreview(template, { asset: " RLUSD " })!).searchParams.get("asset")).toBe("RLUSD");
  });

  it("encodes entered characters without changing the free-preview flag", () => {
    const url = new URL(resolvePreview(template, { asset: "RLUSD&preview=0#x" })!);
    expect(url.searchParams.get("asset")).toBe("RLUSD&preview=0#x");
    expect(url.searchParams.get("preview")).toBe("1");
    expect(url.hash).toBe("");
  });

  it("accepts encoded placeholders and requires every parameter", () => {
    expect(resolvePreview(template.replace("<symbol>", "%3Csymbol%3E"), { asset: "RLUSD" })).toBe(resolvePreview(template, { asset: "RLUSD" }));
    expect(resolvePreview(template + "&chain=<chain>", { asset: "RLUSD" })).toBeNull();
  });

  it("preserves concrete manifest previews byte for byte", () => {
    for (const url of [
      "https://councilof.ai/api/receipts/batch?from=2026-01-01T00:00:00Z&preview=1",
      "https://councilof.ai/api/art50/marking-evidence?url=https://councilof.ai/og-image.png&preview=1",
    ]) expect(resolvePreview(url, {})).toBe(url);
  });
});
