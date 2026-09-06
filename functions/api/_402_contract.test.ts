import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Every 402 this rail issues must name, in the challenge body, two things a buyer needs BEFORE
 * paying: where to look for free, and exactly what settling buys.
 *
 * Audited live on 2026-09-06: only 4 of 9 doors carried both. free-door had no `csoai` block at
 * all; eunomia-data and proof each had their own vocabulary (`free_for`/`sold`, `free`/
 * `verification`) that a reader would have to reverse-engineer. A buyer reading such a challenge
 * cannot tell what they are about to buy, which is the one question a 402 exists to answer.
 *
 * This is a SOURCE check, deliberately. Probing nine live doors on every commit is a probe storm
 * against our own edge (governor rule G5), and the field either appears in the producer or it does
 * not.
 */
const API = resolve(__dirname);

function walk(d: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".ts") && !p.includes(".test.")) out.push(p);
  }
  return out;
}

const doors = walk(API).filter((f) => /buildPaymentRequiredV2\(/.test(readFileSync(f, "utf8")))
  .filter((f) => !f.endsWith("_x402.ts"));

describe("every 402 door answers 'what am I buying?' in the challenge", () => {
  it("finds the doors, so this cannot pass vacuously", () => {
    expect(doors.length, "no door calls buildPaymentRequiredV2 — the guard has lost its subject")
      .toBeGreaterThanOrEqual(9);
  });

  it("each names a free_preview a stranger can GET", () => {
    const missing = doors.filter((f) => !/free_preview\s*:/.test(readFileSync(f, "utf8")))
      .map((f) => f.split("/functions/")[1]);
    expect(missing, "a 402 that names no free preview asks for money with nothing to look at first")
      .toEqual([]);
  });

  it("each states its deliverable in a sentence", () => {
    const missing = doors.filter((f) => !/deliverable\s*:/.test(readFileSync(f, "utf8")))
      .map((f) => f.split("/functions/")[1]);
    expect(missing, "a 402 without a deliverable sentence does not say what settling buys").toEqual([]);
  });

  it("the free door says it sells nothing, rather than implying a purchase", () => {
    const src = readFileSync(resolve(API, "free-door.ts"), "utf8");
    expect(src).toMatch(/sells nothing|buys nothing/);
  });
});
