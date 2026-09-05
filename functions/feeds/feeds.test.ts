import { describe, expect, it } from "vitest";
import { entries as corrections, atomBody } from "./corrections.xml";
import { entries as cards } from "./cards.xml";
import { entries as roots } from "./roots.xml";
import { rss, atom, esc } from "./_xml";

describe("feeds are DERIVED, not typed", () => {
  it("corrections come from the ledger and are newest-first by the entry's own date", () => {
    const e = corrections();
    expect(e.length).toBeGreaterThan(20);
    const dates = e.map((x) => x.iso);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(e[0].id).toMatch(/^https:\/\/councilof\.ai\/api\/corrections#C-/);
    // every entry carries the three things a correction IS
    for (const x of e) {
      expect(x.body).toContain("WHAT WAS WRONG:");
      expect(x.body).toContain("HOW IT WAS CAUGHT:");
      expect(x.body).toContain("FIX:");
    }
  });

  it("cards feed is a window on the newest signed cards, each individually verifiable", () => {
    const e = cards();
    expect(e.length).toBeGreaterThan(0);
    expect(e.length).toBeLessThanOrEqual(50);
    const iso = e.map((x) => x.iso);
    expect([...iso].sort().reverse()).toEqual(iso);
    expect(e[0].body).toContain("verify-card.mjs");
    expect(e[0].body).toContain("integrity claim, not a truth claim");
  });

  it("roots feed publishes ONE item and guids it by merkle_root, so a poll is not a change", () => {
    const e = roots();
    expect(e.length).toBe(1);
    expect(e[0].id).toMatch(/#[0-9a-f]{16,}/);
    expect(e[0].body).toContain("bytes only");
  });

  it("no feed stamps itself with the time it was served", () => {
    // Two renders moments apart must be byte-identical. A feed that carries new Date() reports
    // a change on every poll and tells its reader nothing — the defect this estate has shipped
    // before (an API stamping last_checked at request time).
    const a = rss("t", "https://councilof.ai/f.xml", "d", corrections());
    const b = rss("t", "https://councilof.ai/f.xml", "d", corrections());
    expect(a).toBe(b);
    expect(atomBody()).toBe(atomBody());
    // And nothing in the OUTPUT carries today's date unless an artifact actually said so:
    // every pubDate must trace back to an entry's own iso, not to the clock.
    const pubDates = [...a.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map((m) => new Date(m[1]).toISOString().slice(0, 10));
    const sourceDates = new Set(corrections().map((x) => new Date(x.iso + "T00:00:00Z").toISOString().slice(0, 10)));
    for (const d of pubDates) expect(sourceDates.has(d)).toBe(true);
  });

  it("atom updated is the newest ENTRY's timestamp, not now()", () => {
    const e = corrections();
    const body = atom("t", "https://councilof.ai/f.atom", "d", e);
    const m = body.match(/<updated>([^<]+)<\/updated>/);
    expect(m).toBeTruthy();
    expect(new Date(m![1]).toISOString().slice(0, 10)).toBe(new Date(e[0].iso + "T00:00:00Z").toISOString().slice(0, 10));
  });

  it("escapes text so one apostrophe cannot break the document", () => {
    expect(esc(`a & b < c > d "e"`)).toBe("a &amp; b &lt; c &gt; d &quot;e&quot;");
    const body = rss("t", "s", "d", [{ id: "i", title: `A & B <x>`, link: "https://x/", iso: "2026-09-05", body: `"q" & <y>` }]);
    expect(body).not.toMatch(/<title>A & B <x><\/title>/);
    expect(body).toContain("A &amp; B &lt;x&gt;");
  });

  it("rss is well-formed enough to parse: one item per entry, guids unique", () => {
    const e = corrections();
    const body = rss("t", "s", "d", e);
    expect((body.match(/<item>/g) || []).length).toBe(e.length);
    const guids = [...body.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map((m) => m[1]);
    expect(new Set(guids).size).toBe(guids.length);
  });
});
