/**
 * Every tab alias must resolve to a tab that exists.
 *
 * Found by scripts/route-surface-truth-gate.mjs (#1501), which reported that
 * /rankings goes to two different places: App.tsx redirected to
 * ?tab=leaderboard while public/_redirects sent cold loads to ?tab=board.
 *
 * Measured 2026-09-06: `leaderboard` is NOT a tab id. It appears in the GROUP
 * map (leaderboard: "work") and as an alias TARGET (rankings: "leaderboard"),
 * but no tab declares id: "leaderboard". So ?tab=rankings and ?tab=leaderboard
 * both resolve to a tab that does not exist, while ?tab=board and the existing
 * ?tab=scoreboard alias both resolve to the real `board` tab.
 *
 * This test fails on the unfixed source: `rankings` resolves to `leaderboard`,
 * which is not in the id set.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, "tabs.ts"), "utf8");

const tabIds = new Set([...src.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
const aliasBlock = /const aliases: Record<string, string> = \{([\s\S]*?)\}/.exec(src)?.[1] ?? "";
const aliases = Object.fromEntries(
  [...aliasBlock.matchAll(/"?([a-z0-9-]+)"?:\s*"([a-z0-9-]+)"/g)].map((m) => [m[1], m[2]]),
);

const resolveAlias = (v: string) => {
  let cur = v;
  for (let i = 0; i < 5 && aliases[cur]; i++) cur = aliases[cur];
  return cur;
};

describe("tab aliases point at tabs that exist", () => {
  it("has at least the aliases this test was written for", () => {
    expect(Object.keys(aliases).length).toBeGreaterThan(4);
    expect(aliases).toHaveProperty("rankings");
    expect(aliases).toHaveProperty("scoreboard");
  });

  it("resolves EVERY alias to a declared tab id", () => {
    const broken = Object.keys(aliases)
      .map((a) => [a, resolveAlias(a)] as const)
      .filter(([, target]) => !tabIds.has(target));
    expect(broken).toEqual([]);
  });

  it("sends rankings to the board tab, the same place a cold load lands", () => {
    // public/_redirects sends /rankings -> /dashboard?tab=board. The SPA must agree,
    // or a hop and a cold load show different tabs.
    expect(resolveAlias("rankings")).toBe("board");
    expect(tabIds.has(resolveAlias("rankings"))).toBe(true);
  });

  it("keeps the existing scoreboard alias working, which already pointed at board", () => {
    expect(resolveAlias("scoreboard")).toBe("board");
  });
});
