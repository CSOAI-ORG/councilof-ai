import { describe, expect, it } from "vitest";
import { badgeRows, MEMBERSHIPS } from "./MembershipStrip";

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
