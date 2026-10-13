import { describe, expect, it } from "vitest";
import { hasSlot, previewFields, resolvePreview } from "./previewTemplate";

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

/**
 * 2026-10-13. /services/ rendered <a href="…/api/wrapper?id=<wrapped-symbol:chain>&preview=1">
 * and the outward gate followed it to HTTP 400. The slot's name has a colon, the old grammar
 * allowed letters, digits, "_" and "-", so the template was taken for a concrete URL.
 */
describe("a template is never a link", () => {
  const wrapper = "https://councilof.ai/api/wrapper?id=<wrapped-symbol:chain>&preview=1";

  it("reads the wrapper slot as a slot and withholds the link until it is filled", () => {
    expect(previewFields(wrapper)).toEqual([{ key: "id", hint: "wrapped-symbol:chain" }]);
    expect(resolvePreview(wrapper, {})).toBeNull();
    expect(resolvePreview(wrapper, { id: "<wrapped-symbol:chain>" })).toBeNull();
    const filled = new URL(resolvePreview(wrapper, { id: "usdc.e:arbitrum" })!);
    expect(filled.pathname).toBe("/api/wrapper");
    expect(filled.searchParams.get("id")).toBe("usdc.e:arbitrum");
    expect(filled.searchParams.get("preview")).toBe("1");
    expect(hasSlot(filled.href)).toBe(false);
  });

  it("holds for every slot form the rail has published, and for forms it has not", () => {
    for (const template of [
      wrapper,
      "https://councilof.ai/api/wrapper/changes?id=<wrapped-symbol:chain>&preview=1",
      "https://councilof.ai/api/measurement/fresh-capsule?endpoint=<https MCP URL>&dimension=TOOLS&preview=1",
      "https://councilof.ai/api/art50/marking-evidence?url=<https://\u2026>&preview=1",
      "https://councilof.ai/api/receipts/batch?from=<iso>&to=<iso>&preview=1",
      "https://councilof.ai/api/proof?sha=<64-hex>",
      "https://councilof.ai/api/rwa/evidence?asset=<symbol|issuer_address>",
      "https://councilof.ai/api/rwa/evidence?asset=%3Csymbol%3E&preview=1",
      "https://councilof.ai/agent-cards/<host>/",
      "https://councilof.ai/api/ras/mcp-probe?url=https://<host>/mcp&preview=1",
      "https://councilof.ai/axis/{axis}",
      "/api/wrapper?id=<wrapped-symbol:chain>&preview=1",
    ]) {
      expect(hasSlot(template), template).toBe(true);
      expect(resolvePreview(template, {}), template).toBeNull();
    }
  });

  it("fails closed on a slot it cannot fill, even when another slot was filled", () => {
    expect(resolvePreview("https://councilof.ai/stablecoins/<asset>/?chain=<chain>", { chain: "base" })).toBeNull();
    expect(resolvePreview("https://councilof.ai/api/x?url=https://<host>/mcp&id=<id>", { id: "a" })).toBeNull();
  });

  it("does not mistake what the reader typed for a slot", () => {
    const href = resolvePreview("https://councilof.ai/api/rwa/evidence?asset=<symbol>&preview=1", { asset: "{RLUSD}" });
    expect(new URL(href!).searchParams.get("asset")).toBe("{RLUSD}");
  });
});
