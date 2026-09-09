import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Careers.tsx", import.meta.url), "utf8");

describe("Careers public-claims guard", () => {
  it("does not advertise jobs or benefits that have not been approved", () => {
    expect(source).not.toMatch(/type:\s*["']Full-time/i);
    expect(source).not.toMatch(/Comprehensive health coverage/i);
    expect(source).not.toMatch(/Equity Options/i);
    expect(source).not.toMatch(/Apply Now/i);
  });

  it("states the present collaboration boundary plainly", () => {
    expect(source).toMatch(/not currently advertising paid full-time vacancies/i);
    expect(source).toMatch(/not a promise of employment, salary, benefits, or equity/i);
    expect(source).toMatch(/active problem areas, not advertised jobs/i);
  });
});
