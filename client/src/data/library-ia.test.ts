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
