import { describe, expect, it } from "vitest";
import { entries as corrections, atomBody } from "./corrections.xml";
import { entries as cards } from "./cards.xml";
import { entries as roots } from "./roots.xml";
import { rss, atom, esc } from "./_xml";

/** A field line whose whole value is the word undefined: what an unread optional field prints. */
const FIELD_UNDEFINED = /(?:^|\n)(?:WHAT WAS WRONG|HOW IT WAS CAUGHT|FIX|WHAT CHANGED|STATUS|STILL OPEN): (?:undefined|null)?\s*(?:\n|$)/;

describe("feeds are DERIVED, not typed", () => {
  it("corrections come from the ledger and are newest-first by the entry's own date", () => {
    const e = corrections();
    expect(e.length).toBeGreaterThan(20);
    const dates = e.map((x) => x.iso);
    expect([...dates].sort().reverse()).toEqual(dates);
    // Each item links the readable page, anchored to the entry; /corrections/#<id> opens it.
    expect(e[0].id).toMatch(/^https:\/\/councilof\.ai\/corrections\/#C-/);
    expect(e[0].link).toBe(e[0].id);
    // every entry carries the three things a correction IS, under the label its fields earn
    for (const x of e) {
      expect(x.body).toContain("WHAT WAS WRONG:");
      expect(x.body).toContain("HOW IT WAS CAUGHT:");
      expect(x.body).toMatch(/(?:^|\n)(?:FIX|WHAT CHANGED): \S/);
      expect(x.body).toContain("STATUS:");
      // T12 (2026-10-06): the 34 newest entries printed "FIX: undefined". The guard is on the
      // field VALUE: ledger prose may legitimately quote the word (C-2026-0920-01 quotes a
      // "leader: undefined" JavaScript bug), so the test reads field lines, not substrings.
      expect(x.body).not.toMatch(FIELD_UNDEFINED);
    }
  });

  it("no rendered corrections feed (RSS or Atom) prints an undefined field", () => {
    expect(atomBody()).not.toMatch(FIELD_UNDEFINED);
    expect(rss("t", "https://councilof.ai/feeds/corrections.xml", "d", corrections())).not.toMatch(FIELD_UNDEFINED);
    // and the guard can go red
    expect("WHAT WAS WRONG: x\n\nFIX: undefined\n\nSTATUS: y").toMatch(FIELD_UNDEFINED);
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
