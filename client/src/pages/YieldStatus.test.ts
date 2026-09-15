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

describe("/status is a service status page, not the homepage", () => {
  it("declares itself and names the five component groups with an explicit unknown state", () => {
    expect(source).toContain('data-testid="service-status"');
    expect(source).not.toContain("home-verify");
    expect(source).not.toContain("HeroSlides");
    for (const group of ["Public website", "Evidence API", "Verification resources", "Measurement queue", "Publication mirrors"]) {
      expect(source).toContain(`"${group}"`);
    }
    expect(source).toContain('"UNKNOWN"');
    expect(source).toContain('"UNAVAILABLE"');
    expect(source).toContain("/api/health");
    expect(source).toContain("/api/state");
    expect(source).toContain("/api/worker");
  });

  it("never promotes a page load into all-services-operational", () => {
    expect(source).not.toMatch(/all systems operational|all services operational|uptime\s*\d/i);
    expect(source).toMatch(/proves nothing about any other component/);
  });
});
