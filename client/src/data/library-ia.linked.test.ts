/**
 * A current page that a primary surface links to must not wear the "Reference / archive" banner.
 * Live, 18 Nov 2026: /careers/, /open-source/, /team/ and /metered/ all did. Each promotion is
 * tied to the link that makes the page primary, so removing that link fails here instead of
 * leaving a stale entry behind.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isLibraried, isPrimaryPath } from "./library-ia";

const read = (rel: string) => readFileSync(resolve(__dirname, rel), "utf8");
const footer = read("../components/Footer.tsx");
const headerNav = read("../components/HeaderNav.tsx");
const homeProducts = read("../components/home/HomeProducts.tsx");
const linksTo = (path: string) => new RegExp(`['"\`]${path}/?['"\`]`);

describe("current pages linked from a primary surface", () => {
  it.each([
    ["/careers", "the footer's Careers link", footer],
    ["/metered", "the footer's metered evidence catalog link", footer],
    ["/team", "the header nav's Team link", headerNav],
    ["/open-source", "the home page's open source card", homeProducts],
  ])("%s is primary and never archived (%s)", (path, _surface, source) => {
    expect(source).toMatch(linksTo(path));
    expect(isPrimaryPath(path)).toBe(true);
    expect(isLibraried(path)).toBe(false);
    expect(isLibraried(`${path}/`)).toBe(false);
  });
});
