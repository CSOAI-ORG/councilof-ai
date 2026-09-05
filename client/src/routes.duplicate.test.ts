/**
 * routes.duplicate.test.ts — no path may be declared twice in App.tsx.
 *
 * WHY. App.tsx declares 498 routes. wouter matches the FIRST <Route> whose path matches, so a
 * second declaration of the same path is unreachable code: the component named there can never
 * render, and nothing anywhere says so. Two exist today and both hide a real page:
 *
 *   /badges     line  709  -> Redirect to "/badge"     (wins)
 *               line 1061  -> BadgesPage               (dead — and it is the NEWEST file, 2 Sep)
 *   /challenge  line  674  -> Challenge                (wins)
 *               line  711  -> ChallengeDoor            (dead)
 *
 * Neither is resolved here on purpose. Which page a visitor should see is a product decision
 * that changes public truth — /badge -> BadgeKit looks like deliberate canonicalisation, yet
 * BadgesPage was added after it and is plainly meant to be seen by someone. Guessing would
 * silently change what the site shows. The guard makes the collision impossible to add to, and
 * the two known cases are listed as owner-gated exceptions so this fails on the NEXT one
 * immediately rather than after another 498 routes accumulate.
 *
 * Remove an entry from KNOWN below the moment its route is resolved; the test fails if a listed
 * exception is no longer duplicated, so the list cannot rot into permanent permission.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = readFileSync(path.join(here, "App.tsx"), "utf8");

/** Paths known to be duplicated, awaiting an owner decision. Not permission — a countdown. */
const KNOWN_DUPLICATES = new Set(["/badges", "/challenge"]);

function declaredPaths(): string[] {
  // Only <Route path="…"> declarations; ignore hrefs, redirect targets and strings elsewhere.
  return [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
}

function duplicates(paths: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of paths) counts.set(p, (counts.get(p) ?? 0) + 1);
  return new Map([...counts].filter(([, n]) => n > 1));
}

describe("App.tsx declares each route path once", () => {
  it("finds the routes at all (guards against the regex silently matching nothing)", () => {
    const paths = declaredPaths();
    expect(paths.length).toBeGreaterThan(100);
    expect(paths).toContain("/dashboard");
  });

  it("has no duplicate path beyond the known, owner-gated collisions", () => {
    const dupes = duplicates(declaredPaths());
    const unexpected = [...dupes.keys()].filter((p) => !KNOWN_DUPLICATES.has(p));
    expect(
      unexpected,
      `these paths are declared more than once, so the later component is unreachable: ` +
        `${unexpected.join(", ")}. wouter matches the first route only. Remove one, or add it ` +
        `to KNOWN_DUPLICATES with an owner decision recorded.`,
    ).toEqual([]);
  });

  it("known duplicates are still duplicated — the exception list cannot rot", () => {
    const dupes = duplicates(declaredPaths());
    const resolved = [...KNOWN_DUPLICATES].filter((p) => !dupes.has(p));
    expect(
      resolved,
      `${resolved.join(", ")} is no longer duplicated. Delete it from KNOWN_DUPLICATES so the ` +
        `list keeps meaning "awaiting a decision" rather than "permanently allowed".`,
    ).toEqual([]);
  });
});
