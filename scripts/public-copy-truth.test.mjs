// Claims four public pages made on 22 Nov 2026 that nothing behind them supported, each read live:
// - /measure/ (hand-written static page) said "Re-attestation SaaS lives on /pricing" and promised a "verified
//   measurement credential". BRAND-GUIDELINES.md §5: no subscription tiers; the one-line description says
//   we publish signed measurement records.
// - /complaints/ promised a named adjudicator, an independent second-reviewer appeal and quarterly statistics.
//   public/governance/conflicts-register.json lists every reviewer and adjudicator role as OPEN_SLOT. It also
//   gave a second timetable (2 and 10 working days) against /dispute/'s 3 and 20 business days, and a second
//   address (complaints@) beside the one mailbox in client/src/lib/buying.ts.
// - /complaints/, /conflicts-of-interest/ and /impartiality/ linked /standards/house-standard/, a 404.
// - The momentum strip headed "Published every day." while the daily report pull requests sat unmerged.
//   The strip prints each figure's own as_of; that is the claim it can keep.
// Each check reads the file a reader is served, or the record the claim depends on, never a comment.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const strip = (html) => html.replace(/<!--[\s\S]*?-->/g, " ");
// A check for an absent phrase must not be satisfied, or tripped, by a comment that names the phrase.
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("/measure/ sells no subscription and no credential", () => {
  const page = strip(read("public/measure/index.html"));
  it("names no SaaS and no credential", () => {
    expect(page).not.toMatch(/\bSaaS\b/);
    expect(page).not.toMatch(/credential/i);
  });
  it("says what replaces them", () => {
    expect(page).toContain("There is no subscription.");
    expect(page).toContain("signed measurement record, not a certification");
  });
});

describe("/complaints/ promises only what is staffed", () => {
  const page = strip(read("public/complaints/index.html"));
  const register = JSON.parse(read("public/governance/conflicts-register.json"));
  const mailbox = read("client/src/lib/buying.ts").match(/CONTACT_MAILBOX = "([^"]+)"/)?.[1];
  const dispute = read("client/src/pages/Dispute.tsx");

  it("does not promise a reviewer the conflicts register lists as unfilled", () => {
    const open = register.roles.filter((r) => r.status === "OPEN_SLOT").map((r) => r.role);
    expect(open.some((r) => /appeals reviewer/i.test(r))).toBe(true); // the premise this test rests on
    expect(page).not.toMatch(/A named adjudicator/);
    expect(page).not.toMatch(/appeal to a second reviewer/i);
    expect(page).not.toMatch(/A reviewer who was not part of the first decision/);
    expect(page).toMatch(/OPEN_SLOT/);
  });

  it("promises no quarterly statistics that are not published", () => {
    expect(page).not.toMatch(/Quarterly we publish|every quarter/i);
  });

  it("uses the one mailbox", () => {
    expect(mailbox).toBe("contact@csoai.org");
    expect(page).not.toMatch(/complaints@csoai\.org/);
    expect(page).toContain(`mailto:${mailbox}?subject=Complaint`);
  });

  it("gives the same times as /dispute/, the same route", () => {
    const ack = dispute.match(/acknowledgement\s+within\s+(\d+)\s+business\s+days/)?.[1];
    const decide = dispute.match(/Reasoned\s+decision\s+within\s+(\d+)\s+business\s+days/)?.[1];
    expect(ack && decide).toBeTruthy();
    expect(page).toContain(`We acknowledge within <strong>${ack} business days</strong>`);
    expect(page).toContain(`within <strong>${decide} business days</strong> of receipt`);
    expect(page).toContain(`<tr><td>Acknowledge</td><td>${ack} business days</td>`);
    expect(page).toContain(`<tr><td>Decide</td><td>${decide} business days</td>`);
    expect(page).toContain('href="/dispute/"');
  });
});

describe("no governance page links the unpublished House Standard", () => {
  for (const p of ["public/complaints/index.html", "public/conflicts-of-interest/index.html", "public/impartiality/index.html"]) {
    it(p, () => {
      expect(read(p)).not.toContain("/standards/house-standard/");
    });
  }
});

describe("the momentum strip claims what it prints", () => {
  const src = code(read("client/src/components/momentum/MomentumStrip.tsx"));
  it("does not claim daily publication", () => {
    expect(src).not.toMatch(/Published every day/);
  });
  it("says each figure shows its read time, and renders that time", () => {
    expect(src).toContain("Every figure shows when it was read.");
    expect(src).toMatch(/as of <time dateTime=\{f\.as_of\}>/);
  });
});

describe("/independence/ stamps the register read it records", () => {
  it("shows the same date the source records for the Companies House read", () => {
    const src = read("client/src/pages/Independence.tsx");
    const recorded = src.match(/Companies House, read (\d{4})-(\d{2})-(\d{2})/);
    expect(recorded).toBeTruthy();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shown = `Register facts read on ${Number(recorded[3])} ${months[Number(recorded[2]) - 1]} ${recorded[1]}.`;
    expect(src).toContain(shown);
  });
});
