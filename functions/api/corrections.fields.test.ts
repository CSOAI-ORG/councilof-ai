/**
 * Every ledger entry has a remedy and a reason, and every surface reads them the same way.
 *
 * Persona audit T12 (2026-10-06): /corrections printed a blank "Fix:" on the 34 newest entries,
 * the RSS/Atom feed printed "FIX: undefined", and /press printed an empty "Fix." paragraph —
 * because newer entries carry `what_changed` (and often `open_items`) where older ones carry
 * `fix`, and each surface read `fix` directly. The fields are now read through one helper on the
 * server (functions/_lib/corrections-fields.ts) and its twin on the client
 * (client/src/lib/attestations.ts); this test holds both to the ledger and to each other.
 */
import { describe, expect, it } from "vitest";
import { LEDGER } from "./corrections";
import * as server from "../_lib/corrections-fields";
import * as client from "../../client/src/lib/attestations";

type Entry = {
  id: string;
  what_was_wrong?: unknown;
  fix?: unknown;
  what_changed?: unknown;
  how_caught?: unknown;
  detected_by?: unknown;
  status?: unknown;
};
const entries = (LEDGER as unknown as { corrections: Entry[] }).corrections;
const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

describe("corrections ledger: every entry can be read without a blank", () => {
  it("reads a real ledger (not a vacuous pass)", () => {
    expect(entries.length).toBeGreaterThan(50);
  });

  it("every entry has a what_was_wrong, and a fix or a what_changed", () => {
    const bad = entries.filter((c) => !filled(c.what_was_wrong) || !(filled(c.fix) || filled(c.what_changed))).map((c) => c.id);
    expect(bad).toEqual([]);
  });

  it("remedyOf / caughtOf / statusOf return non-empty text and never 'undefined', on both sides", () => {
    for (const c of entries) {
      for (const lib of [server, client] as const) {
        const r = lib.remedyOf(c as never);
        const caught = lib.caughtOf(c as never);
        const status = lib.statusOf(c as never);
        for (const t of [r.text, caught, status]) {
          expect(typeof t, c.id).toBe("string");
          expect(t.trim().length, c.id).toBeGreaterThan(0);
          // The value itself is never the word undefined/null (an unread field). Ledger prose may
          // quote the word — C-2026-0920-01 describes a "leader: undefined" bug — so the guard is on
          // the whole value, not a substring.
          expect(["undefined", "null"], c.id).not.toContain(t.trim());
        }
        expect(["Fix", "What changed"]).toContain(r.label);
      }
      expect(client.remedyOf(c as never)).toEqual(server.remedyOf(c as never));
      expect(client.caughtOf(c as never)).toBe(server.caughtOf(c as never));
      expect(client.statusOf(c as never)).toBe(server.statusOf(c as never));
    }
  });

  it("what_changed is never labelled Fix, and fix always is", () => {
    expect(server.remedyOf({ what_changed: "x" }).label).toBe("What changed");
    expect(server.remedyOf({ fix: "y", what_changed: "x" })).toEqual({ label: "Fix", text: "y" });
    expect(server.remedyOf({})).toEqual({ label: "What changed", text: "not recorded in this entry" });
    expect(server.caughtOf({ detected_by: "persona test" })).toBe("not recorded in this entry (detected by: persona test)");
    expect(server.caughtOf({})).toBe("not recorded in this entry (detected by: UNRECORDED)");
    expect(server.statusOf({})).toBe("status not recorded");
  });
});
