import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import MembershipStrip, { HONESTY_LINE, MEMBERSHIPS, evidenceHref, groupedRows } from "./MembershipStrip";
import Memberships from "../pages/Memberships";

/**
 * The strip renders the manifest and nothing else: every row gets a link to its evidence, the
 * honesty line is verbatim, and no banned display string reaches the page. The same for the
 * /memberships page, which is the manifest again as a table and a FAQ.
 */

// React's static markup escapes the apostrophe too (&#x27;); a helper that forgets it fails on
// the first row whose prose says "the group's".
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

const home = renderToStaticMarkup(
  <Router ssrPath="/">
    <MembershipStrip variant="home" />
  </Router>,
);
const footer = renderToStaticMarkup(
  <Router ssrPath="/">
    <MembershipStrip variant="footer" />
  </Router>,
);
const page = renderToStaticMarkup(
  <Router ssrPath="/memberships">
    <Memberships />
  </Router>,
);

// Banned as OUR claim on a public surface. "certif" is banned outright in this feature's copy:
// the retraction forms brand-gate tolerates are not needed here, so none are used.
const BANNED = [/certif/i, /\bsovereign\b/i, /\bBFT\b/, /byzantine/i, /defoneos/i, /\$\s?\d/];

describe("MembershipStrip", () => {
  it("reads a manifest with rows in every declared group", () => {
    expect(MEMBERSHIPS.schema).toBe("csoai.memberships/0.1");
    expect(MEMBERSHIPS.signed).toBe(false);
    expect(MEMBERSHIPS.rows.length).toBeGreaterThan(0);
    for (const g of groupedRows()) expect(g.rows.length).toBeGreaterThan(0);
  });

  it("renders every manifest row as a link to its evidence (home)", () => {
    for (const r of MEMBERSHIPS.rows) {
      expect(home, `row ${r.id} short name`).toContain(esc(r.short));
      expect(home, `row ${r.id} href`).toContain(`href="${esc(evidenceHref(r))}"`);
    }
  });

  it("links every row in the footer line too, and points at /memberships", () => {
    for (const r of MEMBERSHIPS.rows) expect(footer, `footer row ${r.id}`).toContain(`href="${esc(evidenceHref(r))}"`);
    expect(footer).toContain('href="/memberships"');
    expect(footer).toContain("Where we take part →");
  });

  it("carries the honesty line verbatim, in both variants, equal to the manifest's", () => {
    expect(HONESTY_LINE).toBe("Participation is not endorsement, and a listing is not adoption. Every entry links to its evidence.");
    expect(MEMBERSHIPS.honesty_line).toBe(HONESTY_LINE);
    expect(home).toContain(esc(HONESTY_LINE));
    expect(footer).toContain(esc(HONESTY_LINE));
  });

  it("marks pending and private-evidence rows instead of upgrading them", () => {
    for (const r of MEMBERSHIPS.rows) {
      if (r.state === "PENDING") expect(home).toContain("pending");
      if (!r.public_evidence) {
        expect(r.evidence_kind).not.toBe("public_url");
        expect(evidenceHref(r)).toBe(`/memberships#${r.id}`);
      } else {
        expect(r.evidence.startsWith("https://")).toBe(true);
      }
    }
  });

  it("ships no third-party brand asset and no banned display string", () => {
    const src = readFileSync(resolve(__dirname, "MembershipStrip.tsx"), "utf8");
    expect(src).not.toMatch(/<img\b/);
    expect(src).not.toMatch(/\.(svg|png|webp)["']/);
    for (const re of BANNED) {
      expect(home, `home matches ${re}`).not.toMatch(re);
      expect(footer, `footer matches ${re}`).not.toMatch(re);
      expect(page, `page matches ${re}`).not.toMatch(re);
    }
  });

  it("types no count of rows anywhere in the copy", () => {
    // A typed count is the number nothing retires. The strip and page name rows; they never count them.
    const n = String(MEMBERSHIPS.rows.length);
    expect(home).not.toMatch(new RegExp(`\\b${n}\\s+(bodies|entries|memberships|listings|rows)`, "i"));
    expect(page).not.toMatch(new RegExp(`\\b${n}\\s+(bodies|entries|memberships|listings|rows)`, "i"));
  });
});

describe("/memberships page", () => {
  it("renders every row with both honesty columns and an anchor", () => {
    for (const r of MEMBERSHIPS.rows) {
      expect(page, `row ${r.id} anchor`).toContain(`id="${r.id}"`);
      expect(page, `row ${r.id} proves`).toContain(esc(r.what_it_proves));
      expect(page, `row ${r.id} does not prove`).toContain(esc(r.what_it_does_not_prove));
      expect(page, `row ${r.id} state`).toContain(r.state);
    }
  });

  it("emits FAQPage JSON-LD from the rows that carry a question, and nothing more", () => {
    const blocks = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const faq = blocks.find((b) => b["@type"] === "FAQPage");
    expect(faq).toBeTruthy();
    const withQ = MEMBERSHIPS.rows.filter((r) => r.question && r.answer);
    expect(faq.mainEntity.length).toBe(withQ.length);
    for (const r of withQ) {
      const q = faq.mainEntity.find((e: { name: string }) => e.name === r.question);
      expect(q, `faq ${r.id}`).toBeTruthy();
      expect(q.acceptedAnswer.text).toBe(r.answer);
    }
    // Answer engines get the same claim as humans: every answer with public evidence cites it.
    for (const r of withQ) if (r.public_evidence) expect(r.answer).toContain(r.evidence);
  });

  it("links the machine-readable manifest", () => {
    expect(page).toContain('href="/interop/memberships.json"');
  });
});
