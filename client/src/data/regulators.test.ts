import { describe, expect, it } from "vitest";
import { REGIMES } from "./regulators";
import { HIVE, getHive } from "./hive-frameworks";

/**
 * The regression suite for the Regulator Atlas's dead jurisdictions.
 *
 * The defect: five regimes on the Atlas — Colorado, China, UK, Canada and
 * Singapore, i.e. every non-EU jurisdiction it covers — carried a `hiveSlug`
 * pointing at a Framework Hive page that had never been written. Nothing checked
 * the reference, so the Atlas rendered an "Open in the Hive →" button for each
 * and a regulator arriving from any of those five countries hit a hard 404.
 *
 * The invariant below is the fix: a hiveSlug is a claim that a page exists, and
 * that claim is now checked at test time rather than discovered by a visitor.
 */
describe("Regulator Atlas → Framework Hive references", () => {
  it("every hiveSlug resolves to a real Hive framework", () => {
    const dead = REGIMES.filter((r) => r.hiveSlug && !getHive(r.hiveSlug)).map(
      (r) => `${r.slug} -> /hive/${r.hiveSlug}`,
    );
    expect(dead).toEqual([]);
  });

  it("does not silently drop a jurisdiction: every regime is still on the Atlas", () => {
    // Removing the dead link must never become "remove the regime". A regulator
    // from an uncovered jurisdiction still gets the full card.
    for (const region of ["United Kingdom", "Canada", "China", "Singapore"]) {
      expect(REGIMES.some((r) => r.region === region)).toBe(true);
    }
    expect(REGIMES.some((r) => r.region.includes("Colorado"))).toBe(true);
  });

  it("regime slugs are unique", () => {
    const slugs = REGIMES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("Framework Hive", () => {
  it("hive slugs are unique", () => {
    const slugs = HIVE.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("getHive returns undefined for an unknown slug rather than a placeholder", () => {
    expect(getHive("a-framework-that-does-not-exist")).toBeUndefined();
  });
});
