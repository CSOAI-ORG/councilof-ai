// /notes and /notes/:slug — every evidence note gets one canonical, citable page.
//
// This test fails when a note in client/src/data/evidence-notes.json would ship without a page:
// no route, no prerender snapshot, no bare→slash redirect, no sitemap entry, no feed item, or an
// Article node missing the fields answer engines cite. It also runs every note through the same
// copy rules the press list keeps (copyRuleViolations), and applies the ruled-out words to the
// page's own chrome.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import data from "../data/evidence-notes.json";
import {
  VERIFY_URL,
  articleLd,
  bannedIn,
  copyRuleViolations,
  indexLd,
  noteUrl,
  notesNewestFirst,
} from "../data/evidence-notes";
import { isPrimaryPath } from "../data/library-ia";
import { NOTES_PAGE_COPY } from "./EvidenceNotes";
import { entries as feedEntries } from "../../../functions/feeds/notes.xml";

const root = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const page = read("client/src/pages/EvidenceNotes.tsx");
const app = read("client/src/App.tsx");
const prerender = read("scripts/prerender.mjs");
const redirects = read("public/_redirects");
const sitemap = read("public/sitemap.xml");
const llms = read("scripts/llms/llms.txt.tmpl");
const feedsIndex = read("functions/feeds/index.ts");

describe("/notes wiring", () => {
  it("routes the index and every note (route, title, prerender derivation, PRIMARY_PATHS)", () => {
    expect(app).toContain('const EvidenceNotesIndex = lazy(() => import("./pages/EvidenceNotes"))');
    expect(app).toContain('<Route path="/notes/:slug" component={EvidenceNotePage} />');
    expect(app).toContain('<Route path="/notes" component={EvidenceNotesIndex} />');
    // The :slug route must be declared before the index, or wouter never reaches it.
    expect(app.indexOf('path="/notes/:slug"')).toBeLessThan(app.indexOf('path="/notes"'));
    // Titles live in client/src/data/seo-head.json since 2026-09-16 (one producer, see lib/seoHead.ts).
    expect(JSON.parse(read("client/src/data/seo-head.json")).routes["/notes"]?.title).toMatch(/^Evidence notes/);
    expect(prerender).toContain('found.add("/notes")');
    expect(prerender).toContain('readFileSync("client/src/data/evidence-notes.json"');
    expect(isPrimaryPath("/notes")).toBe(true);
    expect(llms).toContain("https://councilof.ai/notes/");
    expect(llms).toContain("https://councilof.ai/feeds/notes.xml");
    expect(feedsIndex).toContain('"/feeds/notes.xml"');
  });

  it("does not write its own canonical <link> or <title> — the central writer owns both", () => {
    expect(page).not.toMatch(/rel="canonical"/);
    expect(page).not.toContain("<title>");
  });

  it("lists notes newest first on the index", () => {
    const dates = notesNewestFirst().map((n) => n.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(notesNewestFirst()).toHaveLength(data.notes.length);
  });

  it("the index JSON-LD references every note page", () => {
    const ld = indexLd();
    expect(ld["@type"]).toBe("CollectionPage");
    expect(ld.url).toBe("https://councilof.ai/notes/");
    expect(ld.hasPart.map((p) => p.url).sort()).toEqual(data.notes.map((n) => noteUrl(n.id)).sort());
  });

  it("the page chrome carries no ruled-out words", () => {
    for (const text of Object.values(NOTES_PAGE_COPY)) expect(bannedIn(text)).toBeNull();
    expect(NOTES_PAGE_COPY.verify).toContain("How to verify");
    expect(VERIFY_URL).toBe("https://councilof.ai/gspc-verify/");
  });

  it("the notes feed carries one item per note, linking the note page, dated by the note", () => {
    const items = feedEntries();
    expect(items.map((i) => i.link).sort()).toEqual(data.notes.map((n) => noteUrl(n.id)).sort());
    for (const item of items) {
      const note = data.notes.find((n) => noteUrl(n.id) === item.link)!;
      expect(item.iso).toBe(note.date);
      expect(item.title).toBe(note.title);
    }
  });
});

for (const note of data.notes) {
  describe(`/notes/${note.id}/`, () => {
    const path = `/notes/${note.id}`;
    const url = `https://councilof.ai/notes/${note.id}/`;

    it("has a routable slug, a prerender-able path, a bare→slash rule and a sitemap entry", () => {
      expect(note.id).toMatch(/^[a-z0-9-]+$/);
      expect(isPrimaryPath(path)).toBe(true);
      expect(redirects).toContain(`${path}  ${path}/  308`);
      expect(sitemap).toContain(`<loc>${url}</loc>`);
      expect(noteUrl(note.id)).toBe(url);
    });

    it("emits an Article with headline, date, publisher, url, mainEntityOfPage and citations", () => {
      const ld = articleLd(note);
      expect(ld["@type"]).toBe("Article");
      expect(ld.headline).toBe(note.title);
      expect(ld.description).toBe(note.summary);
      expect(ld.datePublished).toBe(note.date);
      for (const org of [ld.author, ld.publisher]) {
        expect(org["@type"]).toBe("Organization");
        expect(org.name).toBe("Council of AI");
        expect(org.legalName).toBe("CSOAI Ltd");
      }
      expect(ld.url).toBe(url);
      expect(ld.mainEntityOfPage["@id"]).toBe(url);
      expect(ld.citation).toEqual(note.artifacts.map((a) => a.url));
      expect(ld.citation.length).toBeGreaterThan(0);
    });

    it("passes the evidence-notes copy rules", () => {
      expect(copyRuleViolations(note)).toEqual([]);
    });
  });
}
