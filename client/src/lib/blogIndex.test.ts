import { describe, expect, it } from "vitest";
import { blogdata } from "../data/blog-content";
import {
  ALL_PERIODS,
  UNDATED,
  blogPeriodFilters,
  buildBlogIndex,
  countedReadTime,
  decodeEntities,
  declaredReadTime,
  filterByPeriod,
  formatDateLabel,
  formatPeriod,
  periodGradient,
} from "./blogIndex";

const cards = buildBlogIndex();

describe("buildBlogIndex — one card per real article", () => {
  it("emits exactly one card per dataset entry, and invents none", () => {
    expect(cards).toHaveLength(blogdata.length);
    expect(cards.map((c) => c.slug).sort()).toEqual(blogdata.map((e) => e.slug).sort());
  });

  it("links every card at /blog/<slug>", () => {
    for (const card of cards) expect(card.href).toBe(`/blog/${card.slug}`);
  });

  it("gives every card a title and an excerpt from the entry itself", () => {
    for (const card of cards) {
      const entry = blogdata.find((e) => e.slug === card.slug)!;
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.excerpt.length).toBeGreaterThan(0);
      expect(decodeEntities(entry.ogTitle || entry.title)).toBe(card.title);
    }
  });

  it("orders newest first and sinks undated posts to the end", () => {
    const dated = cards.filter((c) => c.date);
    const undated = cards.filter((c) => !c.date);
    for (let i = 1; i < dated.length; i++) {
      expect(dated[i - 1].date! >= dated[i].date!).toBe(true);
    }
    expect(cards.slice(dated.length)).toEqual(undated);
  });

  it("never invents a date: a post with no JSON-LD gets no date label", () => {
    for (const card of cards) {
      const entry = blogdata.find((e) => e.slug === card.slug)!;
      const hasPublished = (entry.ldJson ?? []).some((j) => j.includes("datePublished"));
      if (!hasPublished) {
        expect(card.date).toBeNull();
        expect(card.dateLabel).toBeNull();
        expect(card.period).toBe(UNDATED);
      }
    }
  });

  it("prefers the read time the article prints about itself", () => {
    for (const card of cards) {
      const entry = blogdata.find((e) => e.slug === card.slug)!;
      const declared = declaredReadTime(entry.content);
      expect(card.readTimeDeclared).toBe(declared !== null);
      expect(card.readTime).toBe(`${declared ?? countedReadTime(entry.content)} min read`);
    }
  });

  it("is deterministic", () => {
    expect(buildBlogIndex()).toEqual(cards);
  });
});

describe("period filter — every pill selects real posts", () => {
  const filters = blogPeriodFilters(cards);

  it("leads with All and lists only periods that exist in the data", () => {
    expect(filters[0]).toBe(ALL_PERIODS);
    const real = new Set(cards.map((c) => c.period));
    for (const period of filters.slice(1)) expect(real.has(period)).toBe(true);
    expect(filters.slice(1)).toHaveLength(real.size);
  });

  it("never yields an empty result for a pill that is offered", () => {
    for (const period of filters) {
      expect(filterByPeriod(cards, period).length).toBeGreaterThan(0);
    }
  });

  it("partitions the full set across the period pills", () => {
    const total = filters.slice(1).reduce((n, p) => n + filterByPeriod(cards, p).length, 0);
    expect(total).toBe(cards.length);
    expect(filterByPeriod(cards, ALL_PERIODS)).toEqual(cards);
  });

  it("gives a pill the same gradient as the cards it selects", () => {
    for (const period of filters.slice(1)) {
      const gradient = periodGradient(cards, period);
      for (const card of filterByPeriod(cards, period)) expect(card.gradient).toBe(gradient);
    }
  });
});

describe("derivation helpers", () => {
  it("formats a date without depending on the host locale", () => {
    expect(formatDateLabel("2026-08-25")).toBe("Aug 25, 2026");
    expect(formatDateLabel("2026-01-04")).toBe("Jan 4, 2026");
    expect(formatDateLabel("not a date")).toBeNull();
    expect(formatPeriod("2026-08-25")).toBe("August 2026");
    expect(formatPeriod("nope")).toBeNull();
  });

  it("decodes the HTML entities the dataset stores in ogTitle", () => {
    expect(decodeEntities("What&#x27;s Changing")).toBe("What's Changing");
    expect(decodeEntities("hard&rsquo;s case")).toBe("hard’s case");
    expect(decodeEntities("R&amp;D Tax Credits")).toBe("R&D Tax Credits");
    expect(decodeEntities("plain text")).toBe("plain text");
  });

  it("reads a declared read time, and counts words when there is none", () => {
    expect(declaredReadTime('<span class="article-readtime">15 min read</span>')).toBe(15);
    expect(declaredReadTime("<p>⏱️ 12 min read</p>")).toBe(12);
    expect(declaredReadTime("<p>no such marker</p>")).toBeNull();
    expect(countedReadTime("<p>one two three</p>")).toBe(1);
    expect(countedReadTime(`<p>${"word ".repeat(900)}</p>`)).toBe(4);
  });

  it("ignores script and style bodies when counting words", () => {
    const noisy = `<style>${"x ".repeat(2000)}</style><p>three real words</p>`;
    expect(countedReadTime(noisy)).toBe(1);
  });
});
