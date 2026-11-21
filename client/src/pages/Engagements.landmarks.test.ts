/**
 * /engagements renders inside the app shell, which already provides the page's one <main> landmark.
 * The page itself rendered a second <main>, and the deploy's content-promise gate refused the build
 * ("dist/client/engagements/index.html: 2 <main> landmarks (one per page)", deploy run 44671973489,
 * 2026-11-20), so no merge to master reached production until it was fixed.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "Engagements.tsx"), "utf8");

describe("/engagements landmarks", () => {
  it("renders no <main> of its own; the shell's <main> is the page's only one", () => {
    expect(page).not.toMatch(/<main[\s>]/);
    expect(page).not.toMatch(/<\/main>/);
  });
});
