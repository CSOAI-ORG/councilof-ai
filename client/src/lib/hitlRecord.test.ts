import { describe, expect, it } from "vitest";
import { filterHitlReceipts, parseHitlRecord } from "./hitlRecord";

const entry = () => ({
  schema: "csoai.hitl-oversight-receipt/0.1",
  at: "2026-10-29T04:00:00Z",
  operator: "fixture reviewer",
  axis: "governance",
  decision: "HOLD",
  note: "Await evidence",
  challenge: {
    id: "challenge-123",
    subject: "Fixture change",
    proposed_action: "Update an owned fixture",
  },
  signature: { value_hex: null, unsigned_reason: "fixture", did: null },
});
const record = () => ({
  schema: "csoai.hitl-record/0.1",
  store_bound: true,
  count: 1,
  receipts: [entry()],
});
describe("public decision-record boundary", () => {
  it("preserves the original fields and never upgrades signature or decision meaning", () => {
    const value = record();
    const parsed = parseHitlRecord(JSON.stringify(value));
    expect(parsed).toEqual(value);
    expect(parsed.receipts[0].signature.value_hex).toBeNull();
    expect(parsed.receipts[0].decision).toBe("HOLD");
  });
  it("preserves no-store empty state separately from an empty bound store", () => {
    for (const store_bound of [true, false]) {
      expect(
        parseHitlRecord(
          JSON.stringify({ ...record(), store_bound, count: 0, receipts: [] }),
        ).store_bound,
      ).toBe(store_bound);
    }
  });
  it.each([
    [
      "wrong schema",
      (v: any) => {
        v.schema = "another";
      },
    ],
    [
      "missing store state",
      (v: any) => {
        delete v.store_bound;
      },
    ],
    [
      "missing rows",
      (v: any) => {
        delete v.receipts;
      },
    ],
    [
      "count mismatch",
      (v: any) => {
        v.count = 2;
      },
    ],
    [
      "unknown decision",
      (v: any) => {
        v.receipts[0].decision = "EXECUTED";
      },
    ],
    [
      "bad date",
      (v: any) => {
        v.receipts[0].at = "yesterday";
      },
    ],
    [
      "missing challenge",
      (v: any) => {
        v.receipts[0].challenge = null;
      },
    ],
    [
      "bad signature field",
      (v: any) => {
        v.receipts[0].signature.did = {};
      },
    ],
    [
      "unreadable second row",
      (v: any) => {
        v.count = 2;
        v.receipts.push({});
      },
    ],
  ])("rejects %s instead of claiming absence or dropping a row", (_, alter) => {
    const value = record();
    alter(value);
    expect(() => parseHitlRecord(JSON.stringify(value))).toThrow();
  });
  it("rejects an HTML error body", () =>
    expect(() => parseHitlRecord("<html>unavailable</html>")).toThrow());
  it("filters by the recorded challenge and outcome without changing records", () => {
    const parsed = parseHitlRecord(JSON.stringify(record()));
    expect(filterHitlReceipts(parsed.receipts, " CHALLENGE-123 ")).toHaveLength(
      1,
    );
    expect(filterHitlReceipts(parsed.receipts, "hold")).toHaveLength(1);
    expect(filterHitlReceipts(parsed.receipts, "APPROVED")).toHaveLength(0);
    expect(parsed.receipts).toHaveLength(1);
  });
});
