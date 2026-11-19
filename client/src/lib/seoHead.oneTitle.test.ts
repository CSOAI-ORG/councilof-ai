/**
 * Three pages still rendered their own <title> inside <Helmet> after #4458 left the head to
 * seo-head.json. Read live on 18 Nov 2026 (06:24Z):
 * - /specimens/kokotajlo/ and /specimens/rlusd/ shipped the same title twice.
 * - /status/internal/ shipped "Weekly yield template" twice, while the page itself reads "Reference
 *   withdrawn" and "This operator reference is no longer published".
 * The one writer (seoHead, from seo-head.json) now carries the page's own words, and the pages
 * render no <title> of their own.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import head from "../data/seo-head.json";

type Entry = { title: string; description: string };
const routes = (head as { routes: Record<string, Entry> }).routes;
const components = (head as { components: Record<string, Entry> }).components;
const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");
const helmetBlocks = (src: string) => [...src.matchAll(/<Helmet>([\s\S]*?)<\/Helmet>/g)].map((m) => m[1]);

describe("one title per page", () => {
  it.each(["KokotajloSpecimen", "RlusdSpecimen", "YieldInternal"])("%s renders no <title> of its own", (page) => {
    expect(helmetBlocks(read(`pages/${page}.tsx`)).some((b) => /<title\b/.test(b))).toBe(false);
  });

  it("YieldInternal keeps its noindex tag", () => {
    expect(read("pages/YieldInternal.tsx")).toContain('<meta name="robots" content="noindex,nofollow,noarchive" />');
  });

  it("/status/internal's head says what the page says: the reference is withdrawn", () => {
    const page = read("pages/YieldInternal.tsx");
    expect(page).toContain("Reference withdrawn");
    expect(page).toContain("This operator reference is no longer published.");
    for (const [key, entry] of [["/status/internal", routes["/status/internal"]], ["YieldInternal", components.YieldInternal]] as const) {
      expect(entry?.title, key).toBe("Reference withdrawn | Council of AI");
      expect(entry?.description, key).toMatch(/^This operator reference is no longer published\. /);
      expect(entry?.description.length, key).toBeGreaterThanOrEqual(110);
      expect(entry?.description.length, key).toBeLessThanOrEqual(160);
    }
  });
});
