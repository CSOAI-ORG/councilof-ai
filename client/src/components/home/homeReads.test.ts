/**
 * homeReads — the readers behind every live figure on the front door.
 *
 * Pinned here, because each of these is a place a number could quietly become a lie:
 *  - a corpus count is never separated from its KIND (measured vs catalogued), and the two
 *    corpora are never added
 *  - the corrections count is counted from the rows served, and a STALE signature is printed
 *  - a population door that publishes no total says so in words rather than showing a figure
 *  - the ten doors are ten lines, never one sum
 *  - a calendar-pending timestamp is never reported as anchored
 *  - an absent payload is an absence, never a zero
 */
import { describe, expect, it } from "vitest";
import {
  POPULATION_DOORS,
  corpusOverlap,
  correctionsSummary,
  doorLine,
  manifestSummary,
  otsSplit,
  rootLeafCount,
  rootSummary,
  shortRoot,
  signedCardsVerified,
} from "./homeReads";

describe("evidence-state readers", () => {
  const state = {
    card_chain: { bodies_verified_valid: { value: 335, kind: "measured" } },
    public_root: { card_count: { value: 305, kind: "catalogued" } },
    signed_cards: { corpus_relation: { identifier_overlap: 0 } },
  };

  it("carries the kind beside the signed-card count", () => {
    expect(signedCardsVerified(state)).toEqual({ value: 335, kind: "measured" });
  });

  it("reads the root leaf count as its own, separate corpus", () => {
    expect(rootLeafCount(state)).toBe(305);
    // The two are different sets. Nothing in this module adds them.
    expect(rootLeafCount(state)).not.toBe(signedCardsVerified(state)!.value);
  });

  it("reports an overlap of zero as zero, and an absent one as absent", () => {
    expect(corpusOverlap(state)).toBe(0);
    expect(corpusOverlap({})).toBeNull();
    expect(corpusOverlap(null)).toBeNull();
  });

  it("never turns an absent count into a number", () => {
    expect(signedCardsVerified({})).toBeNull();
    expect(signedCardsVerified(null)).toBeNull();
    expect(rootLeafCount({ public_root: {} })).toBeNull();
  });
});

describe("public root reader", () => {
  const root = {
    as_of: "2026-09-22T08:54:02Z",
    card_count: 305,
    merkle_root: "40ce3833118fab76a98c55429a5b06c7c3051915780893f3ab60a25cb31ac0a4",
    sig_ed25519: "a39f3caf",
  };

  it("reports the signing state from the bytes, not from the word 'signed'", () => {
    expect(rootSummary(root)).toEqual({
      asOf: "2026-09-22T08:54:02Z",
      leaves: 305,
      root: root.merkle_root,
      signed: true,
    });
    expect(rootSummary({ ...root, sig_ed25519: undefined })!.signed).toBe(false);
  });

  it("returns null rather than a partial root when the payload has no merkle root", () => {
    expect(rootSummary({ as_of: "x", card_count: 1 })).toBeNull();
    expect(rootSummary(null)).toBeNull();
  });

  it("shortens a root for prose without changing it", () => {
    expect(shortRoot(root.merkle_root)).toBe("40ce3833…b31ac0a4");
    expect(shortRoot("abc")).toBe("abc");
  });
});

describe("corrections reader", () => {
  it("counts the rows served and prints the signature state as served", () => {
    const s = correctionsSummary({
      corrections: [
        { id: "C-1", date: "2026-01-01" },
        { id: "C-2", date: "2026-02-02" },
        { id: "C-3", date: "2026-03-03" },
        { id: "C-4", date: "2026-04-04" },
      ],
      signature_state: "STALE",
    })!;
    expect(s.entries).toBe(4);
    // A published defect is published. It is never swallowed or rendered as "signed".
    expect(s.signatureState).toBe("STALE");
    expect(s.latest.map((r) => r.id)).toEqual(["C-4", "C-3", "C-2"]);
  });

  it("says the signature state is not published rather than inventing one", () => {
    expect(correctionsSummary({ corrections: [] })!.signatureState).toBe("not published");
    expect(correctionsSummary({})).toBeNull();
  });
});

describe("population door reader", () => {
  it("prints the door's own figure, unit, state and as-of", () => {
    const l = doorLine("swift", {
      title: "SWIFT-linked bank census",
      state: "INDEXED",
      n: 26,
      n_unit: "sourced bank rows",
      as_of: "2026-09-01",
    });
    expect(l).toMatchObject({
      figure: "26",
      hasFigure: true,
      unit: "sourced bank rows",
      state: "INDEXED",
      asOf: "2026-09-01",
      href: "/api/pop/swift?preview=1",
    });
  });

  it("says so in words when the artifact refuses a total, and shows no figure", () => {
    const l = doorLine("x402-bazaar", { title: "x402 Bazaar listings", state: "INDEXED", n: null, as_of: "2026-09-17" });
    expect(l.figure).toBe("no total published");
    expect(l.hasFigure).toBe(false);
  });

  it("marks an unread door UNREAD with its reason, never zero", () => {
    const l = doorLine("a2a", null, "/api/pop/a2a answered HTTP 500");
    expect(l.state).toBe("UNREAD");
    expect(l.figure).toBe("unread");
    expect(l.unit).toContain("HTTP 500");
    expect(l.figure).not.toBe("0");
  });

  it("shows a dash while the read is still in flight", () => {
    expect(doorLine("xrpl", null).figure).toBe("—");
  });

  it("keeps ten doors as ten lines — nothing here can sum them", () => {
    expect(POPULATION_DOORS).toHaveLength(10);
    const lines = POPULATION_DOORS.map((id, i) => doorLine(id, { n: i + 1, state: "INDEXED" }));
    expect(lines).toHaveLength(10);
    expect(new Set(lines.map((l) => l.figure)).size).toBe(10);
    expect(Object.keys(doorLine("xrpl", { n: 16 }))).not.toContain("total");
  });
});

describe("timestamp split", () => {
  const ots = {
    head: { declared_counts: { proofs: 600, bitcoin_attested: 56, calendar_pending: 544 } },
  };

  it("keeps confirmed and merely-submitted proofs apart", () => {
    const s = otsSplit(ots)!;
    expect(s).toEqual({ attested: 56, pending: 544, total: 600 });
    // The pending ones are never folded into the attested figure.
    expect(s.attested).toBeLessThan(s.total);
  });

  it("returns null when the artifact does not declare the split", () => {
    expect(otsSplit({ head: {} })).toBeNull();
    expect(otsSplit(null)).toBeNull();
  });
});

describe("x402 manifest reader", () => {
  it("counts the doors and tools from the arrays served, never from a declared total", () => {
    expect(
      manifestSummary({
        resources: [{ url: "a" }, { url: "b" }, { url: "c" }],
        mcp: { url: "https://councilof.ai/mcp", free_tools: ["x", "y"], paid_tools: ["z"] },
      }),
    ).toEqual({ doors: 3, freeTools: 2, paidTools: 1, mcpUrl: "https://councilof.ai/mcp" });
  });

  it("returns null when there is no resource list to count", () => {
    expect(manifestSummary({})).toBeNull();
    expect(manifestSummary(null)).toBeNull();
  });
});
