import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isLibraried } from "./library-ia";

const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const homeBoard = readFileSync(resolve(__dirname, "../components/home/HomeGspcBoard.tsx"), "utf8");

describe("live GSPC axis routes", () => {
  it("does not mark the board's promoted axis detail pages as archived", () => {
    expect(app).toContain('<Route path="/gspc/:axis" component={GspcScoreboard} />');
    expect(homeBoard).toContain('href={`/gspc/${encodeURIComponent(a.axis)}/`}');
    expect(isLibraried("/gspc/governance/")).toBe(false);
    expect(isLibraried("/gspc/safety/")).toBe(false);
    expect(isLibraried("/gspc/jail")).toBe(false);
    expect(isLibraried("/pdca")).toBe(true);
  });
});

describe("current legal terms", () => {
  it("does not mark any operative Terms alias as an archived reference", () => {
    expect(app).toContain('<Route path="/terms-of-service" component={TermsOfService} />');
    expect(app).toContain('<Route path="/terms" component={TermsOfService} />');
    expect(app).toContain('<Route path="/legal/terms" component={TermsOfService} />');
    for (const path of ["/terms-of-service/", "/terms/", "/legal/terms/"]) {
      expect(isLibraried(path)).toBe(false);
    }
  });
});
