import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import MembershipStrip, { badgeRows, isExternalHref, HONESTY_LINE, KIND_LABEL, MEMBERSHIPS } from "./MembershipStrip";

describe("home badge row", () => {
  it("derives every pill from the manifest and never types a count", () => {
    const rows = badgeRows();
    expect(rows.length).toBeGreaterThan(0);
    for (const b of rows) expect(b.href.length).toBeGreaterThan(1);
    const w3c = rows.find((b) => b.label === "W3C Community Groups");
    if (w3c) expect(w3c.count).toBe(MEMBERSHIPS.rows.filter((r) => r.group === "standards" && /^W3C /.test(r.org)).length);
  });
  it("drops a body when it leaves the manifest", () => {
    const m = { ...MEMBERSHIPS, rows: MEMBERSHIPS.rows.filter((r) => !/^C2PA/.test(r.org)) };
    expect(badgeRows(m).some((b) => b.label === "C2PA")).toBe(false);
    expect(badgeRows().some((b) => b.label === "C2PA")).toBe(true);
  });
});

describe("home badge row — links and legibility", () => {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  const badges = renderToStaticMarkup(
    <Router ssrPath="/">
      <MembershipStrip variant="badges" />
    </Router>,
  );

  /**
   * THE BUG THIS HOLDS SHUT. Every pill used to render through wouter's <Link>, including the
   * pills whose href is a third-party https URL. wouter intercepts the click and pushes the
   * absolute URL into the app's history instead of leaving the site, so those pills never
   * reached the evidence they promised. External hrefs must be plain anchors.
   */
  it("renders an off-site pill as an anchor, not a routed link", () => {
    const external = badgeRows().filter((b) => isExternalHref(b.href));
    expect(external.length, "at least one pill points off-site").toBeGreaterThan(0);
    for (const b of external) expect(badges).toContain(`<a href="${esc(b.href)}" rel="noopener noreferrer"`);
    for (const b of badgeRows().filter((x) => !isExternalHref(x.href))) {
      expect(b.href.startsWith("/"), `${b.label} is an in-site path`).toBe(true);
    }
  });

  it("says what kind of participation each pill is, and carries the honesty line", () => {
    for (const b of badgeRows()) {
      expect(badges, `pill ${b.label}`).toContain(esc(b.label));
      expect(badges, `kind of ${b.label}`).toContain(KIND_LABEL[b.kind]);
    }
    expect(badges).toContain('data-testid="membership-strip-badges-honesty"');
    expect(badges).toContain(esc(HONESTY_LINE));
  });

  it("derives every group pill's count from the rows and never types one", () => {
    for (const id of ["registries", "scholarly"]) {
      const pill = badgeRows().find((b) => b.href === `/memberships#${id}`);
      expect(pill, `group pill for ${id}`).toBeTruthy();
      expect(pill!.count).toBe(MEMBERSHIPS.rows.filter((r) => r.group === id).length);
    }
    // A filing is a submission, not a standing: it gets no hero pill.
    expect(badgeRows().some((b) => b.href === "/memberships#filings")).toBe(false);
  });

  it("keeps each pill on one line so the row stays legible when it wraps at 390px", () => {
    expect(badges).toMatch(/whitespace-nowrap/);
    expect(badges).toMatch(/flex-wrap/);
  });
});
