/**
 * K07 — the three surfaces must come off ONE template, and the two static ones
 * must be producer output rather than hand-edited artefacts.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const games = readFileSync(resolve(ROOT, "public/dashboard/games.html"), "utf8");
const interop = readFileSync(resolve(ROOT, "public/interop/index.html"), "utf8");
const catalogue = JSON.parse(
  readFileSync(resolve(ROOT, "public/interop/games-arcade.json"), "utf8"),
);

describe("one template", () => {
  it("both static pages carry the same chrome and palette", () => {
    for (const page of [games, interop]) {
      expect(page).toContain("header class=\"site\"");
      expect(page).toContain("footer class=\"site\"");
      expect(page).toContain("#04070d"); // the estate ink, on both
      expect(page).toContain("We measure; we never certify.");
    }
  });

  it("neither page carries its old bespoke styling any more", () => {
    // games.html was a LIGHT page: white ground, green heading, its own card css
    expect(games).not.toContain("background: #ffffff");
    expect(games).not.toContain("color: #16a34a");
  });

  it("says the html is generated, so nobody hand-edits it", () => {
    for (const page of [games, interop]) {
      expect(page).toContain("scripts/build-static-pages.mjs");
      expect(page).toContain("edit the producer, never the html");
    }
  });
});

describe("/dashboard/games is derived from the catalogue", () => {
  it("renders one card per catalogued concept, not a typed list", () => {
    const cards = games.match(/class="card"/g) ?? [];
    expect(cards.length).toBe(catalogue.concepts.length);
    expect(cards.length).toBe(catalogue.total_concepts);
  });

  it("names every concept the catalogue names", () => {
    for (const c of catalogue.concepts) expect(games).toContain(c.name);
  });

  it("takes its count from the array rather than typing it", () => {
    expect(games).toContain(`${catalogue.concepts.length} concepts are catalogued`);
  });

  it("carries the catalogue's own limitations and status", () => {
    for (const l of catalogue.limitations) expect(games).toContain(l.slice(0, 40));
    expect(games).toContain(catalogue.status);
    expect(games).toContain("No game emits a signed card");
  });

  it("shows the date it read out of the artifact", () => {
    expect(games).toMatch(/As at \d{1,2} \w+ \d{4}/);
  });
});

describe("the producer is the source of truth", () => {
  it("--check passes against the committed html", () => {
    // If this reds, someone hand-edited a generated page.
    const out = execFileSync("node", ["scripts/build-static-pages.mjs", "--check"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(out).toContain("check OK");
  });

  it("link-gates every interop leaf it lists", () => {
    const out = execFileSync("node", ["scripts/build-static-pages.mjs", "--check"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(out).toMatch(/\d+ interop leaves link-gated/);
  });
});
