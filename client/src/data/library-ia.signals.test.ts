import { describe, expect, it } from "vitest";
import { isLibraried } from "./library-ia";

describe("Signals is a current primary route", () => {
  it("does not put an archive banner on the live Signals page", () => {
    expect(isLibraried("/signals")).toBe(false);
    expect(isLibraried("/signals/")).toBe(false);
    expect(isLibraried("/signals/2026-09-24")).toBe(false);
    expect(isLibraried("/pdca")).toBe(true); // archive classification still works
  });
});
