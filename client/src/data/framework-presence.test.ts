import { describe, it, expect } from "vitest";
import register from "./framework-presence.json";

/**
 * Data-gate for the framework presence register (G2.6).
 *
 * Every row must carry the evidence it claims: an official URL, an HTTP status
 * recorded on the verification date, and version/date fields only when a source
 * note says where they were printed. Voice law: the register never asserts a
 * lab is "unsafe", "compliant" or "certified".
 */

const BANNED = /\b(unsafe|compliant|certified)\b/i;

describe("framework-presence.json", () => {
  it("declares schema, verification date and a bounded method", () => {
    expect(register.schema).toBe("framework-presence/v1");
    expect(register.verified_as_of).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof register.method).toBe("string");
    expect(register.method.length).toBeGreaterThan(50);
  });

  it("every published row has a verified official URL with a recorded HTTP status", () => {
    expect(register.published.length).toBeGreaterThan(0);
    for (const row of register.published) {
      expect(row.lab).toBeTruthy();
      expect(row.framework).toBeTruthy();
      expect(row.official_url).toMatch(/^https:\/\//);
      expect(row.http_status).toBe(200);
      expect(row.as_of).toBe(register.verified_as_of);
      expect(row.source_note).toBeTruthy();
    }
  });

  it("version/date fields appear only with a source note", () => {
    for (const row of register.published) {
      if (row.version || row.date) {
        expect(row.source_note.length).toBeGreaterThan(20);
      }
    }
  });

  it("every empty chair records checked URLs with statuses and a bounded site search", () => {
    expect(register.empty_chairs.length).toBeGreaterThan(0);
    for (const row of register.empty_chairs) {
      expect(row.statement).toContain("no published frontier-safety framework document found");
      expect(row.as_of).toBe(register.verified_as_of);
      expect(row.checked_urls.length).toBeGreaterThan(0);
      for (const c of row.checked_urls) {
        expect(c.url).toMatch(/^https:\/\//);
        expect(typeof c.http_status).toBe("number");
        expect(c.note).toBeTruthy();
      }
      expect(row.site_search).toContain("site:");
    }
  });

  it("keeps the measurement voice — no quality verdicts, and the no-safety-finding disclaimer is present", () => {
    const blob = JSON.stringify(register);
    expect(blob).not.toMatch(BANNED);
    expect(blob).toContain("not a safety finding");
  });
});
