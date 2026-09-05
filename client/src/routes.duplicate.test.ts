/**
 * routes.duplicate.test.ts — no path may be declared twice in App.tsx.
 *
 * WHY. App.tsx declares ~498 routes. wouter matches the FIRST <Route> whose path matches, so a
 * second declaration of the same path is unreachable code: the component named there can never
 * render, and nothing anywhere says so.
 *
 * Two existed and both are now resolved, 2026-09-05, by deleting the declaration that never
 * ran. That is not a product decision and it changes nothing a visitor sees — an unreachable
 * route renders for nobody.
 *
 *   /badges     line  709  -> Redirect to "/badge"   KEPT, it was already the one that won
 *               line 1061  -> BadgesPage             REMOVED as unreachable
 *   /challenge  line  674  -> Challenge              KEPT
 *               line  711  -> ChallengeDoor          REMOVED as unreachable
 *
 * A CORRECTION worth recording, because the earlier note in this file got it wrong. BadgesPage
 * was described as "dead". It is not: the very next line serves it at /authority, so deleting
 * the /badges duplicate cost nothing at all. Reading one line further would have shown that.
 *
 * ChallengeDoor genuinely had no other route, so it is now unreferenced and its lazy import is
 * gone. The file stays on disk. Whether the redress door should be wired somewhere or deleted
 * is a real product question and is left open — but it is now a question about ADDING a page,
 * not an invisible collision hiding one.
 *
 * KNOWN_DUPLICATES is empty and must stay empty. Adding to it requires a recorded owner
 * decision; the test below fails on any new collision immediately.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = readFileSync(path.join(here, "App.tsx"), "utf8");

/** Paths known to be duplicated, awaiting an owner decision. Not permission — a countdown. */
const KNOWN_DUPLICATES = new Set<string>([]);

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

  it("there are no duplicate routes left at all", () => {
    // The exception list is empty, so this is the same assertion as above with nothing
    // excused. Stated separately because it is the one that should stay true forever.
    expect([...duplicates(declaredPaths()).keys()]).toEqual([]);
  });

  it("removing the /badges duplicate did not unpublish BadgesPage", () => {
    // The whole reason that deletion was safe. If /authority ever goes, BadgesPage becomes
    // genuinely unreachable and this fails rather than letting a page vanish quietly.
    expect(app).toMatch(/<Route path="\/authority" component=\{BadgesPage\}/);
  });
});
