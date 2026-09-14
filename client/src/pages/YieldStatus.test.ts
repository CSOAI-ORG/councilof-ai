import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./YieldStatus.tsx", import.meta.url), "utf8");

describe("yield status live-source contract", () => {
  it("keeps independent rows when one dependency fails", () => {
    expect(source).toContain("Promise.allSettled");
    expect(source).not.toContain("Promise.all([");
  });

  it("derives XRPL signed leaves from the reader", () => {
    expect(source).toContain('"/api/xrpl"');
    expect(source).toContain("asset.sig_ed25519");
    expect(source).not.toContain("EP5 not landed");
  });

  it("renders zero outside payers as measured zero", () => {
    expect(source).toContain('typeof payers === "number"');
  });
});
