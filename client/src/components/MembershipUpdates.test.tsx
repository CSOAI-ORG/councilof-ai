import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import MembershipUpdates, { UPDATES, UPDATES_HONESTY_LINE, danglingRowRefs, orderedUpdates } from "./MembershipUpdates";
import { MEMBERSHIPS } from "./MembershipStrip";
import Memberships from "../pages/Memberships";

/**
 * The updates log is the dated trace of what changed in the memberships manifest, and the
 * "Named, and not listed" block is the reason a body a reader expects is absent. Both are read
 * from committed bytes; neither may be typed into a component. These tests hold that, and they
 * hold the one invariant that can rot silently: an update naming a manifest row that no longer
 * exists renders a dead anchor and tells the reader about a row that is gone.
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

const updates = renderToStaticMarkup(
  <Router ssrPath="/memberships">
    <MembershipUpdates />
  </Router>,
);
const page = renderToStaticMarkup(
  <Router ssrPath="/memberships">
    <Memberships />
  </Router>,
);

const BANNED = [/certif/i, /\bsovereign\b/i, /\bBFT\b/, /byzantine/i, /defoneos/i, /\$\s?\d/];

describe("memberships updates artifact", () => {
  it("is the schema it says it is, and says it is unsigned", () => {
    expect(UPDATES.schema).toBe("csoai.memberships-updates/0.1");
    expect(UPDATES.signed).toBe(false);
    expect(UPDATES.entries.length).toBeGreaterThan(0);
  });

  it("carries the honesty line verbatim, equal to the artifact's", () => {
    expect(UPDATES_HONESTY_LINE).toBe(
      "An update is a record of a change, not an announcement of an achievement. Nothing here upgrades a row; the rows say what they prove.",
    );
    expect(UPDATES.honesty_line).toBe(UPDATES_HONESTY_LINE);
    expect(updates).toContain(esc(UPDATES_HONESTY_LINE));
  });

  it("names only manifest rows that exist", () => {
    expect(danglingRowRefs()).toEqual([]);
  });

  it("goes red when an entry names a row the manifest does not have", () => {
    const bad = { ...UPDATES, entries: [{ ...UPDATES.entries[0], row: "no-such-row" }] };
    expect(danglingRowRefs(bad)).toEqual(["no-such-row"]);
  });

  it("orders newest first and keeps committed order inside a date", () => {
    const dates = orderedUpdates().map((u) => u.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("renders every entry with its date, headline and evidence", () => {
    for (const u of UPDATES.entries) {
      expect(updates, `headline ${u.headline}`).toContain(esc(u.headline));
      expect(updates, `detail of ${u.headline}`).toContain(esc(u.detail));
      expect(updates, `evidence of ${u.headline}`).toContain(esc(u.evidence));
      expect(updates, `date of ${u.headline}`).toContain(`dateTime="${u.date}"`);
      if (u.row) expect(updates, `row link ${u.row}`).toContain(`href="/memberships#${u.row}"`);
      if (u.evidence_kind === "public_url") expect(updates).toContain(`href="${esc(u.evidence)}"`);
    }
  });

  it("types no count of its own entries, and ships no banned display string", () => {
    const n = String(UPDATES.entries.length);
    expect(updates).not.toMatch(new RegExp(`\\b${n}\\s+(updates|entries|changes)`, "i"));
    const src = readFileSync(resolve(__dirname, "MembershipUpdates.tsx"), "utf8");
    expect(src).not.toMatch(/<img\b/);
    for (const re of BANNED) expect(updates, `updates matches ${re}`).not.toMatch(re);
  });
});

describe("/memberships — named and not listed", () => {
  it("renders every excluded body with its reason and its source", () => {
    const excluded = MEMBERSHIPS.excluded ?? [];
    expect(excluded.length).toBeGreaterThan(0);
    for (const x of excluded) {
      expect(page, `excluded ${x.org}`).toContain(esc(x.org));
      expect(page, `why ${x.org}`).toContain(esc(x.why));
      if (x.evidence) expect(page, `source ${x.org}`).toContain(`href="${esc(x.evidence)}"`);
    }
  });

  it("gives every declared group an anchor, so /memberships#<group> lands on the group", () => {
    for (const g of MEMBERSHIPS.groups) {
      if (MEMBERSHIPS.rows.some((r) => r.group === g.id)) expect(page, `group anchor ${g.id}`).toContain(`id="${g.id}"`);
    }
  });

  it("mounts the updates log on the page", () => {
    expect(page).toContain('data-testid="membership-updates"');
    expect(page).toContain('href="/interop/memberships-updates.json"');
  });
});
