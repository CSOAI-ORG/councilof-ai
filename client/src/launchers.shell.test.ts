/**
 * launchers.shell.test.ts — how many public launchers bypass a shell that could host them.
 *
 * WP-1 asks that every public launcher opens the /dashboard shell. This pins the measurement
 * the handoff bundle depends on, so the number cannot rot while the routing decision is open.
 *
 * Measured 2026-09-05 across client/src/pages. 82 anchors matched a launcher verb:
 *
 *     7   already open the shell
 *    46   point at a path the shell CAN host   <- the gap
 *    29   point where no pane exists           <- correctly outside (/contact, /globe, /try)
 *
 * A FIRST PASS REPORTED "75 OUTSIDE THE SHELL" AND THAT WAS MISLEADING. It counted every
 * non-/dashboard destination, including ones the shell has no pane for and never should. Only
 * the 46 are a gap; the 29 are correct behaviour. The split is the finding, not the total.
 *
 * The dominant destination is /gspc-verify (25 pages), not /assess (16). That distinction is
 * the decision itself:
 *
 *   /gspc-verify  the `verify` tab is a documented equivalent — tabs.ts states the framed
 *                 route and the native pane "are the same thing there". Repointing loses
 *                 nothing functionally. But verify is the free, loginless, shareable public
 *                 promise, so moving 25 entry points is a product call about that promise.
 *   /assess       there is NO in-shell equivalent: `assess` aliases to `measured`, which
 *                 renders the request pane — a different tool. Repointing would send users
 *                 to the wrong place until the alias and that pane move first.
 *
 * THIS TEST DOES NOT ARGUE FOR EITHER ANSWER. It fails if the gap GROWS, so a new page cannot
 * quietly add another bypassing launcher while the decision is pending, and it fails if the
 * gap shrinks without the recorded number being updated — so whoever repoints them updates
 * the handoff in the same change.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const here = resolve(__dirname);
const tabsSrc = readFileSync(resolve(here, "components/lobby/tabs.ts"), "utf8");

/** Every path the shell can host: a tab path, a pathAlias, or a LOBBY_ROUTE path. */
function shellHostablePaths(): Set<string> {
  const paths = [...tabsSrc.matchAll(/"(\/[a-z0-9/?=&-]+)"/g)].map((m) => m[1]);
  return new Set(paths);
}

const CTA = /<a\s[^>]*href="(\/[a-zA-Z0-9/_?=&-]*)"[^>]*>\s*([^<]{3,60}?)\s*<\/a>/gs;
const VERB = /\b(get measured|start|begin|open|launch|try|run|request|assess|verify)\b/i;

function launchers() {
  const dir = resolve(here, "pages");
  const seen = new Set<string>();
  const out: { page: string; href: string }[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".tsx")) continue;
    const src = readFileSync(resolve(dir, f), "utf8");
    for (const m of src.matchAll(CTA)) {
      const href = m[1];
      const label = m[2].replace(/\s+/g, " ").trim();
      if (!VERB.test(label)) continue;
      const key = `${f}::${href}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ page: f.replace(/\.tsx$/, ""), href });
    }
  }
  return out;
}

/** The measured gap, 2026-09-05. Update this and the handoff together, never separately. */
const RECORDED_GAP = 46;

describe("public launchers versus the shell", () => {
  it("finds launchers at all (guards against the regex matching nothing)", () => {
    expect(launchers().length).toBeGreaterThan(40);
  });

  it("the shell-hostable path set is read from tabs.ts, not hardcoded", () => {
    const p = shellHostablePaths();
    expect(p.size).toBeGreaterThan(10);
    expect(p.has("/gspc-verify")).toBe(true);
  });

  it("the number of launchers bypassing a shell that could host them has not changed", () => {
    const hostable = shellHostablePaths();
    const gap = launchers().filter(
      (l) => !l.href.startsWith("/dashboard") && hostable.has(l.href),
    );
    expect(
      gap.length,
      `${gap.length} launchers point at a shell-hostable path, not the recorded ${RECORDED_GAP}. ` +
        `If it GREW, a new page added a launcher that bypasses a shell able to host it — point ` +
        `it at /dashboard?tab=<id>. If it SHRANK, someone repointed launchers: update ` +
        `RECORDED_GAP and the handoff bundle in the same change so the two cannot disagree.`,
    ).toBe(RECORDED_GAP);
  });

  it("/assess is still the case with no in-shell equivalent", () => {
    // The reason the /assess half of this cannot simply be repointed.
    expect(tabsSrc).toMatch(/assess:\s*"measured"/);
  });
});
