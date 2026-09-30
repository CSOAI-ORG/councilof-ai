/**
 * _ledgers.test.ts — the ledgers block of GET /api/state.
 *
 * What these tests protect (each is a real failure mode, with a planted control where it matters):
 *   - a withdrawn record counted as admitted;
 *   - evidence states collapsed into one word (signature / OTS pending / Bitcoin / public readback);
 *   - a head reported IN_ROOT when the root does not carry it, or NOT_IN_ROOT before any root ran;
 *   - a failed read turned into a number;
 *   - a feed that points at nothing in the authority (a fix receipt or a withdrawal whose correction id
 *     is not in /api/corrections, by id or by a promoted entry's draft_id).
 */
import { describe, expect, it } from "vitest";
import { LEDGER } from "./corrections";
import { LEDGER_META, ledgerRow, ledgersBlock, parseChecks, rootInclusionOf } from "./_ledgers";
import { onRequestGet as stateGet } from "./state";

const ids = new Set((LEDGER.corrections as { id: string }[]).map((c) => c.id));
const draftIds = new Set((LEDGER.corrections as { draft_id?: string }[]).map((c) => c.draft_id).filter(Boolean) as string[]);

describe("ledgers block", () => {
  const b = ledgersBlock();

  it("lists every ledger once, each with one authority and its own served URL", () => {
    const keys = b.ledgers.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual(Object.keys(LEDGER_META).sort());
    const urls = b.ledgers.map((r) => r.served_url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const r of b.ledgers) expect(r.authority_for.length).toBeGreaterThan(10);
  });

  it("keeps the four evidence states as separate fields on every row", () => {
    for (const r of b.ledgers) {
      expect(Object.keys(r.evidence_state)).toEqual(
        expect.arrayContaining(["signature", "public_readback", "root_inclusion", "ots_calendar_pending", "bitcoin_verified"]),
      );
      // OTS/Bitcoin are only stated for a head that is actually in the root
      if (r.evidence_state.root_inclusion !== "IN_ROOT") {
        expect(r.evidence_state.ots_calendar_pending).toBeNull();
        expect(r.evidence_state.bitcoin_verified).toBeNull();
      }
    }
  });

  it("never counts a withdrawn record as admitted", () => {
    expect(b.withdrawals.admitted).toBe(0);
    const w = b.ledgers.find((r) => r.key === "withdrawals-mill-cards")!;
    expect((w.detail as { admitted?: number }).admitted).toBe(0);
  });

  it("a failed read is UNMEASURED with no count, never a number", () => {
    for (const r of b.ledgers) {
      if (r.state !== "PROBED") {
        expect(r.count).toBeNull();
        expect(r.count_kind).toBe("unmeasured");
      } else expect(typeof r.count).toBe("number");
    }
  });

  it("every fix receipt joins to a correction by id or by a promoted draft_id", () => {
    const fx = LEDGER_META["fix-receipts"].atom.payload;
    const refs: string[] = fx.corrections_refs ?? [];
    expect(refs.length).toBeGreaterThan(0);
    const dangling = refs.filter((r) => !ids.has(r) && !draftIds.has(r));
    expect(dangling).toEqual([]);
  });

  it("every withdrawal names a correction the ledger holds", () => {
    const by = (LEDGER_META["withdrawals-mill-cards"].atom.payload.by_correction ?? {}) as Record<string, number>;
    expect(Object.keys(by).length).toBeGreaterThan(0);
    expect(Object.keys(by).filter((c) => !ids.has(c))).toEqual([]);
  });

  it("the corrections head in the served-bytes atom is a ledger id (names, not only a count)", () => {
    const p = LEDGER_META.corrections.atom.payload;
    if (p.state === "PROBED") {
      expect(ids.has(p.head_id)).toBe(true);
      // every id the atom read is still in the ledger this deploy serves: nothing was removed
      if (Array.isArray(p.ids)) expect((p.ids as string[]).filter((i) => !ids.has(i))).toEqual([]);
    }
  });
});

describe("rootInclusionOf (planted controls)", () => {
  const leaves = new Set(["L1"]);
  const inc = { merkle_root: "M", root_as_of: "2026-09-30T05:03:00Z", ledgers: { k: { atom_sha256: "A", leaf_sha256: "L1" }, z: { atom_sha256: "A", leaf_sha256: null } } };
  it("IN_ROOT only when the recorded leaf is in the committed root of the same merkle root", () => {
    expect(rootInclusionOf("k", "A", inc, leaves, "2026-09-30T05:00:00Z", "M").state).toBe("IN_ROOT");
    expect(rootInclusionOf("k", "A", inc, new Set(["L2"]), "2026-09-30T05:00:00Z", "M").state).toBe("NOT_IN_ROOT");
    expect(rootInclusionOf("k", "A", inc, leaves, "2026-09-30T05:00:00Z", "OTHER").state).toBe("NOT_IN_ROOT");
  });
  it("a head the record does not know, or read after the last root, is PENDING, not NOT_IN_ROOT", () => {
    expect(rootInclusionOf("k", "B", inc, leaves, "2026-09-30T05:00:00Z", "M").state).toBe("PENDING_NEXT_ROOT");
    expect(rootInclusionOf("q", "A", inc, leaves, "2026-09-30T05:00:00Z", "M").state).toBe("PENDING_NEXT_ROOT");
    expect(rootInclusionOf("z", "A", inc, leaves, "2026-09-30T06:00:00Z", "M").state).toBe("PENDING_NEXT_ROOT");
    expect(rootInclusionOf("z", "A", inc, leaves, "2026-09-30T04:00:00Z", "M").state).toBe("NOT_IN_ROOT");
  });
});

describe("claim-maintenance checks", () => {
  it("parses the atom's check rows without inventing any", () => {
    expect(parseChecks({ checks: ["r1|day-7|2026-09-29|UNCHANGED", "r1|day-30|2026-10-22|NOT_YET_DUE"] })).toEqual([
      { registry_id: "r1", check: "day-7", due: "2026-09-29", outcome: "UNCHANGED" },
      { registry_id: "r1", check: "day-30", due: "2026-10-22", outcome: "NOT_YET_DUE" },
    ]);
    expect(parseChecks({})).toEqual([]);
  });
});

describe("GET /api/state carries the block", () => {
  it("serves ledgers with the same rows", async () => {
    const res = await (stateGet as any)({ request: new Request("https://councilof.ai/api/state"), env: {} });
    const body = await res.json();
    expect(body.ledgers.ledgers.map((r: { key: string }) => r.key)).toEqual(ledgersBlock().ledgers.map((r) => r.key));
    expect(ledgerRow("corrections").authority_for).toMatch(/corrections of our own/);
  });
});
