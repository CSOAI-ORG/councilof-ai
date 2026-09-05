/**
 * tabs.paneWins.test.ts — a tab's declared `path` must not describe something that cannot happen.
 *
 * HOW THE SHELL RESOLVES A TAB. `DashboardPane` looks up `PANES[id]` FIRST:
 *
 *     const C = PANES[r];
 *     if (!C && tab?.path) return <DashboardEmbeddedView path={tab.path} … />;
 *
 * So when a native pane exists for an id, the tab's `path` is never framed. `DashboardLayout`
 * renders only `<DashboardPane id={activeTab} />` — there is no framed-path branch in the
 * dashboard shell at all — so the pane always wins there.
 *
 * WHAT THAT MAKES `kind: "route"` MEAN. tabs.ts documents "route" as "frames a live page".
 * Three tabs declare `kind: "route"` with a path AND have a native pane, so for those three
 * the declared kind describes behaviour that cannot occur:
 *
 *     tools      path /tools           renders DashboardToolsPane
 *     space      path /gspc-arena      renders DashboardArenaPane
 *     measured   path /assess          renders DashboardRequestPane
 *
 * This is not currently a visible break: each rail label matches the pane that renders
 * ("Requests" → the request pane), and the dashboard shell has no iframe to mis-target. It is
 * a data defect with a real consequence one module over — `decideEmbedNav` in lib/embed.ts
 * branches on `kind`, returning "follow-route" for these three and "drop-iframe" for a native
 * tab. It is therefore deciding on a `kind` that does not match what renders.
 *
 * `board` and `verify` are the documented exceptions: tabs.ts states their framed route and
 * native pane "are the same thing there", so keeping a path is deliberate.
 *
 * THIS TEST DOES NOT CHANGE THE BEHAVIOUR. Whether those three should become `kind: "native"`
 * (which would flip decideEmbedNav to drop-iframe, matching what DashboardPane already does)
 * is a call for whoever owns the lobby. The test pins the current set so the list cannot grow
 * silently, and so the decision is made deliberately rather than inherited.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LOBBY_TABS } from "./tabs";

const paneSrc = readFileSync(
  resolve(__dirname, "../DashboardPane.tsx"),
  "utf8",
);

/** Ids that DashboardPane renders natively, read from the PANES map itself. */
function paneIds(): Set<string> {
  const body = paneSrc.slice(paneSrc.indexOf("const PANES"), paneSrc.indexOf("/** Extra in-shell"));
  return new Set([...body.matchAll(/^\s{2}([a-z0-9]+):\s/gm)].map((m) => m[1]));
}

/** Documented as intentional in tabs.ts: framed route and native pane are the same thing. */
const SAME_THING = new Set(["board", "verify"]);

/**
 * Tabs whose declared path can never be framed. Pinned so the set cannot grow unnoticed.
 * Removing one means it was resolved — delete it here in the same change.
 */
const PANE_WINS_OVER_PATH = new Set(["tools", "space", "measured"]);

describe("a tab's declared path is either framed or acknowledged as unreachable", () => {
  it("reads the PANES map (guards against the regex matching nothing)", () => {
    const ids = paneIds();
    expect(ids.size).toBeGreaterThan(10);
    expect(ids.has("board")).toBe(true);
  });

  it("DashboardPane still resolves the pane before the path", () => {
    // If this ordering ever flips, every conclusion in this file is void.
    expect(paneSrc).toMatch(/const C = PANES\[r\];/);
    expect(paneSrc).toMatch(/if \(!C && tab\?\.path\)/);
  });

  it("the dashboard shell has no framed-path branch of its own", () => {
    const layout = readFileSync(resolve(__dirname, "../DashboardLayout.tsx"), "utf8");
    expect(layout).toMatch(/<DashboardPane id=\{activeTab\} \/>/);
  });

  it("no NEW tab quietly declares a path that will never be framed", () => {
    const ids = paneIds();
    const shadowed = LOBBY_TABS.filter((t) => t.path && ids.has(t.id)).map((t) => t.id);
    const unexpected = shadowed.filter(
      (id) => !SAME_THING.has(id) && !PANE_WINS_OVER_PATH.has(id),
    );
    expect(
      unexpected,
      `these tabs declare a path that DashboardPane will never frame, because a native pane ` +
        `exists for the same id: ${unexpected.join(", ")}. Either drop the path (the rule for ` +
        `a native pane), or record it here with the reason. decideEmbedNav branches on \`kind\`, ` +
        `so a path/kind that does not match what renders makes that decision on false premises.`,
    ).toEqual([]);
  });

  it("the recorded set is still accurate — it cannot rot into permission", () => {
    const ids = paneIds();
    const shadowed = new Set(
      LOBBY_TABS.filter((t) => t.path && ids.has(t.id)).map((t) => t.id),
    );
    const resolved = [...PANE_WINS_OVER_PATH].filter((id) => !shadowed.has(id));
    expect(
      resolved,
      `${resolved.join(", ")} no longer has a shadowed path. Delete it from ` +
        `PANE_WINS_OVER_PATH so this list keeps meaning "known and unresolved".`,
    ).toEqual([]);
  });

  it("the two documented exceptions are still the same-thing pair", () => {
    for (const id of SAME_THING) {
      const tab = LOBBY_TABS.find((t) => t.id === id);
      expect(tab?.kind, `${id} should be native`).toBe("native");
      expect(tab?.path, `${id} should keep its path`).toBeTruthy();
    }
  });
});
