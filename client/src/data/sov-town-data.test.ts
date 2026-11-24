import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSovTownStats, formatCount, UNKNOWN_SOV_TOWN } from "./sov-town-data";

const reply = (data: unknown, ok = true) => ({ ok, json: async () => data });
const setResponses = (...values: Array<unknown | "FAIL">) => {
  const mock = vi.fn(async (url: string, opts?: RequestInit) => {
    expect(opts?.cache).toBe("no-store");
    const i = url.includes("fleet_status_mac") ? 0 : url.includes("fleet_status_vm") ? 1 : 2;
    if (values[i] === "FAIL") throw new Error("unavailable source");
    return reply(values[i]);
  });
  vi.stubGlobal("fetch", mock);
  return mock;
};
beforeEach(() => vi.useRealTimers());
afterEach(() => vi.unstubAllGlobals());
describe("Council Town reported simulation numbers: fail closed", () => {
  it("has no fabricated fallback: unknown is not zero", () => {
    expect(UNKNOWN_SOV_TOWN.source).toBe("unavailable");
    expect(UNKNOWN_SOV_TOWN.episodes).toBeNull();
    expect(UNKNOWN_SOV_TOWN.governedCrimes).toBeNull();
    expect(UNKNOWN_SOV_TOWN.ungovernedCrimes).toBeNull();
    expect(formatCount(null)).toBe("Unknown");
    expect(formatCount(0)).toBe("0");
  });
  it("all sources offline stays unavailable, with no invented numbers", async () => {
    setResponses("FAIL","FAIL","FAIL");
    const x = await fetchSovTownStats();
    expect(x.source).toBe("unavailable");
    expect(x.episodes).toBeNull();
    expect(x.passports).toBeNull();
    expect(x.fetchedAt).toBe("");
  });
  it("one source available never imputes missing zero for other source", async () => {
    setResponses({cum_episodes:2,governed_crimes:0,ungoverned_crimes:5,hives:4}, "FAIL", "FAIL");
    const x = await fetchSovTownStats();
    expect(x.source).toBe("partial");
    expect(x.episodes).toBeNull();
    expect(x.governedCrimes).toBeNull();
    expect(x.ungovernedCrimes).toBeNull();
    expect(x.hives).toBe(4);
    expect(x.passports).toBeNull();
  });
  it("complete valid source responses preserve real reported zero without proving signing", async () => {
    setResponses(
      {cum_episodes:3,governed_crimes:0,ungoverned_crimes:5,models_trained:4,hives:9,updated:"2026-11-24"},
      {cum_episodes:7,governed_crimes:0,ungoverned_crimes:8,models_trained:6,updated:"2026-11-24"},
      {count:13}
    );
    const x = await fetchSovTownStats();
    expect(x.source).toBe("source-reported");
    expect(x.episodes).toBe(10);
    expect(x.governedCrimes).toBe(0);
    expect(x.ungovernedCrimes).toBe(13);
    expect(x.modelsTrained).toBe(10);
    expect(x.passports).toBe(13);
  });
  it("corrupt and non-integer counts cannot turn into zero or positives", async () => {
    setResponses(
      {cum_episodes:-1, governed_crimes:0.5, ungoverned_crimes:Number.MAX_SAFE_INTEGER,hives:"5"},
      {cum_episodes:4, governed_crimes:0, ungoverned_crimes:4},
      {count:-3}
    );
    const x=await fetchSovTownStats();
    expect(x.episodes).toBeNull();
    expect(x.governedCrimes).toBeNull();
    expect(x.ungovernedCrimes).toBeNull();
    expect(x.hives).toBeNull();
    expect(x.passports).toBeNull();
  });
  it("200 response with invalid array body is not a valid source", async () => {
    setResponses([],{cum_episodes:1},{count:1});
    const x=await fetchSovTownStats();
    expect(x.source).toBe("partial");
    expect(x.episodes).toBeNull();
    expect(x.passports).toBe(1);
  });
  it("number formatter bounds invalid values", () => {
    expect(formatCount(Number.NaN)).toBe("Unknown");
    expect(formatCount(-1)).toBe("Unknown");
    expect(formatCount(1.4)).toBe("Unknown");
    expect(formatCount(1000)).toBe("1.0K");
  });
});
