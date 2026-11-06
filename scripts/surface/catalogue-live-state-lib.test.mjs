import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertBoardSentences,
  assertEditionIsOurs,
  canonical,
  countDigest,
  htmlRules,
  jsonRules,
  normalise,
  subOnce,
} from "./catalogue-live-state-lib.mjs";

/**
 * The rules that put a READ number into the published master catalogue.
 *
 * WHY THIS TEST EXISTS. The catalogue published "33 axes · 23 measured · 10 unmeasured" and
 * "331 leaves" and "134 open pull requests" under the heading "Live estate state, read
 * today" for a day after the board had moved to 34 slots and 24 measured and the root to
 * 428 leaves. Nothing objected, because the numbers were typed. These rules are the
 * replacement for typing, so they have to be able to GO RED: a rule that has never fired
 * proves nothing about the tree it passes.
 */
const ROOT = resolve(__dirname, "..", "..");
const read = (p) => readFileSync(resolve(ROOT, p), "utf8");

const READ = {
  board: {
    public_count: "34 axes · 24 measured",
    separation_public_count: "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED",
    axes: 34,
    measured_axes: 24,
    unmeasured_axes: 10,
  },
  root: { card_count: 428, as_of: "2026-11-01T15:09:42Z" },
  corrections: { entries: 93 },
  x402: { resources: 30 },
  skills: { published: 14 },
  mechanism: { totals: { PREDICATE: 1, RELATED_MEASURE: 12, CROSSWALK_ONLY: 38, HASH_ONLY: 366 } },
  register: { subjects: 28, claims: 99, as_of: "2026-11-01T07:17:54Z" },
  prs: 81,
  readAt: "2026-11-02T07:00:00.000Z",
  edition: "2026-11-02",
  supersedes: "2026-11-01",
  unmeasuredAxes: [
    { axis: "lab-practice", family: "subject", kind: "declared-slot", status: "UNMEASURED", n: 0, accuracy: null },
  ],
};

describe("catalogue live-state rules", () => {
  it("replaces the stale board row with the board's own sentence", () => {
    // A fixture standing for the 2026-11-01 edition, whatever the committed page now says:
    // the rules are what is under test, not the page's current state.
    const stale = read("public/jewels/master-catalogue/index.html")
      .replace(
        /<tr><td>GSPC board<\/td><td><strong>[^<]*<\/strong><\/td>/,
        "<tr><td>GSPC board</td><td><strong>33 axes · 23 measured · 10 unmeasured</strong></td>"
      )
      .replace(
        /<tr><td>Public root<\/td><td><strong>[^<]*<\/strong>[^<]*<\/td>/,
        '<tr><td>Public root</td><td><strong>331 leaves</strong>, as_of 2026-10-31T17:48:12Z</td>'
      )
      .replace(
        /<tr><td>x402 catalogue<\/td><td><strong>[^<]*<\/strong><\/td>/,
        "<tr><td>x402 catalogue</td><td><strong>29 resources</strong></td>"
      );
    expect(stale).toContain("33 axes · 23 measured · 10 unmeasured");
    const out = htmlRules(stale, READ);
    expect(out).toContain("34 axes · 24 measured · 10 unmeasured");
    expect(out).not.toContain("33 axes · 23 measured · 10 unmeasured");
    // And every other read row moved too. The assertions are ROW-specific on purpose: the
    // page carries the same digits in its jewel table, so a bare number would be wrong.
    expect(out).toContain('<tr><td>Public root</td><td><strong>428 leaves</strong>');
    expect(out).toContain('<tr><td>x402 catalogue</td><td><strong>30 resources</strong>');
    expect(out).not.toContain('<tr><td>x402 catalogue</td><td><strong>29 resources</strong>');
  });

  it("REFUSES to write when a row is missing — a moved layout fails loudly", () => {
    const broken = read("public/jewels/master-catalogue/index.html").replace(
      /<tr><td>GSPC board<\/td><td><strong>[^<]*<\/strong><\/td>/,
      "<tr><td>GSPC board renamed</td><td><strong>anything</strong></td>"
    );
    expect(() => htmlRules(broken, READ)).toThrow(/GSPC board row/);
  });

  it("REFUSES to write when a row matches twice — ambiguity is not a guess", () => {
    const doubled = read("public/jewels/master-catalogue/index.html").replace(
      /<tr><td>x402 catalogue<\/td>/,
      '<tr><td>x402 catalogue</td><td><strong>29 resources</strong></td></tr>\n<tr><td>x402 catalogue</td>'
    );
    expect(() => htmlRules(doubled, READ)).toThrow(/x402 row/);
  });

  it("with every slot measured the table says \u2014, not nothing at all", () => {
    // The board is at 34 measured of 34 slots, so the unmeasured list is EMPTY in the normal
    // case. An empty tbody reads as a broken page; the table has to say so.
    const full = read("public/jewels/master-catalogue/index.html");
    const out = htmlRules(full, { ...READ, unmeasuredAxes: [] });
    expect(out).toContain('<tr><td colspan="5">\u2014</td></tr>');
    expect(out).not.toMatch(/<tbody><\/tbody>/);
  });

  it("a stale board-count sentence anywhere in the page is refused", () => {
    expect(() =>
      assertBoardSentences('<td>33 axes · 23 measured</td>', READ.board, "index.html")
    ).toThrow(/where the board reads/);
    expect(() =>
      assertBoardSentences('<td>34 axes · 24 measured</td>', READ.board, "index.html")
    ).not.toThrow();
  });

  it("the JSON rules keep the dated counts block and name the edition they supersede", () => {
    // A document standing for the 2026-11-01 edition, whatever the committed file says now.
    const doc = JSON.parse(read("public/jewels/master-catalogue/index.json"));
    const prior = { ...doc, edition: "2026-11-01" };
    const live_state = { ...doc.live_state, read_at: READ.readAt };
    const out = jsonRules(prior, live_state, READ.readAt, READ.edition);
    expect(out.edition).toBe("2026-11-02");
    expect(out.supersedes_edition).toBe("2026-11-01");
    // The dated row-level counts are a dated record of their own read and are not touched.
    expect(out.counts).toEqual(doc.counts);
    // And the document this lane published is marked as its own, so the producer can tell
    // its own edition from another lane's.
    expect(out.edition_written_by).toBe("scripts/surface/rebind-catalogue-live-state.mjs");
  });

  it("the check normalises the read moment and the PR count, and nothing else", () => {
    const a = '<td>Published 2026-11-02T07:00:00.000Z</td>"open_pull_requests": 81';
    const b = '<td>Published 2026-11-02T09:30:00.000Z</td>"open_pull_requests": 49';
    expect(normalise(a)).toBe(normalise(b));
    // A board count is NOT volatile: a changed board must still show as a difference.
    expect(normalise('<td>33 axes · 23 measured</td>')).not.toBe(
      normalise('<td>34 axes · 24 measured</td>')
    );
  });

  it("a content digest is stable where a body digest is not", () => {
    // The corrections ledger re-signs itself on every request: the bytes differ, the
    // counted contents do not. The digest that ships must follow the contents.
    const bodyA = JSON.stringify({ corrections: [{ id: "C-1" }], signature: "sig-A" });
    const bodyB = JSON.stringify({ corrections: [{ id: "C-1" }], signature: "sig-B" });
    expect(bodyA).not.toBe(bodyB);
    expect(countDigest([{ id: "C-1" }])).toBe(countDigest([{ id: "C-1" }]));
    expect(countDigest([{ id: "C-1" }])).not.toBe(countDigest([{ id: "C-2" }]));
  });

  it("REFUSES to overwrite another lane's edition of the same date", () => {
    // On 2026-11-02 another lane published the 2026-11-02 edition at 04:33. This producer
    // ran at 07:13 and would have overwritten it. Two editions dated the same day, one of
    // them silently gone, is a collision, not a publish.
    const theirs = { edition: "2026-11-02", published_at: "2026-11-02T04:33:12.951Z" };
    expect(() => assertEditionIsOurs(theirs, "2026-11-02")).toThrow(/does not overwrite/);
    // A DIFFERENT date is a new edition, not a collision.
    expect(() => assertEditionIsOurs(theirs, "2026-11-03")).not.toThrow();
    // Our own edition of the same date may be re-read.
    expect(() =>
      assertEditionIsOurs(
        { ...theirs, edition_written_by: "scripts/surface/rebind-catalogue-live-state.mjs" },
        "2026-11-02"
      )
    ).not.toThrow();
  });

  it("canonical JSON sorts keys, so equal content has one spelling", () => {
    expect(canonical({ b: 1, a: [2, { d: 4, c: 3 }] })).toBe('{"a":[2,{"c":3,"d":4}],"b":1}');
  });

  it("subOnce requires exactly one match", () => {
    expect(() => subOnce("abc", /z/, "x", "t")).toThrow(/expected exactly 1 match/);
    expect(subOnce("abc", /b/, "X", "t")).toBe("aXc");
  });
});
