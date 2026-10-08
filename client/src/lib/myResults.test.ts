/**
 * My results keeps what a lookup actually returned (tools audit, 6 Oct 2026). A server or record
 * lookup was saved before any answer, with no state; My results then searched the paid-request
 * queue for it and said nothing matched.
 */
import { describe, expect, it } from "vitest";
import { lookupAgainHref, lookupFromRun, paidResult, paidSubject, signedRecordOf, PAID_RECORD_MAX_CHARS } from "./myResults";

describe("My results — lookups", () => {
  it("saves the first tool's own state word, the record it cited and the question asked", () => {
    const row = lookupFromRun("github.com", {
      question: "What is measured about github.com?",
      status: "done",
      tools: [{ label: "NOT_MEASURED", citation: { record_id: "2026-10-06T00:00:00Z" } }],
    });
    expect(row).toEqual({
      kind: "lookup",
      subject: "github.com",
      question: "What is measured about github.com?",
      state: "NOT_MEASURED",
      ref: "2026-10-06T00:00:00Z",
    });
  });

  it("a run that returned no tool is listed with no state, never a guessed one", () => {
    const row = lookupFromRun("github.com", { question: "What is measured about github.com?", status: "error", tools: [] });
    expect(row).toEqual({ kind: "lookup", subject: "github.com", question: "What is measured about github.com?" });
  });

  it("'Look up again' re-asks the original question, or refills Get results for a model", () => {
    expect(lookupAgainHref({ subject: "github.com", question: "What is measured about github.com?" })).toBe(
      "/dashboard?ask=What%20is%20measured%20about%20github.com%3F",
    );
    expect(lookupAgainHref({ subject: "qwen3:8b" })).toBe("/dashboard?lookup=qwen3%3A8b");
  });
});

/**
 * Paid results (paid-route lane, 7 Oct 2026). A paid door's deliverable used to be dropped by the
 * paying page and never reached My results, so "pay → My results → verify" stopped at pay.
 */
describe("My results — paid results", () => {
  const leaf = { payload: { kind: "csoai.art50.marking-evidence/0.1" }, sha256: "ab".repeat(32), sig_ed25519: "cd".repeat(64), did: "did:web:csoai.org#board-attestation-1" };
  const door = "https://councilof.ai/api/art50/marking-evidence?url=https%3A%2F%2Fcouncilof.ai%2Fog-image.png";

  it("finds the signed record wherever the door puts it: card, manifest_card or signature", () => {
    expect(signedRecordOf({ card: leaf })).toBe(leaf);
    expect(signedRecordOf({ manifest_card: leaf, cards: {} })).toBe(leaf);
    expect(signedRecordOf({ capsule: {}, signature: { ...leaf, unsigned_reason: null } })?.sha256).toBe(leaf.sha256);
    expect(signedRecordOf({ card: { payload: "not an object", sha256: "x", sig_ed25519: null } })).toBeNull();
    expect(signedRecordOf(null)).toBeNull();
  });

  it("an art50 pack becomes a row with the record id, the transaction and the record itself to check later", () => {
    const row = paidResult({ doorUrl: door, body: { scope: {}, card: leaf }, transaction: "0x" + "ee".repeat(32) });
    expect(row).toMatchObject({ kind: "paid", subject: "art50/marking-evidence · https://councilof.ai/og-image.png", door, state: "DELIVERED · SIGNED", ref: leaf.sha256, tx: "0x" + "ee".repeat(32) });
    expect(JSON.parse(row.record!)).toEqual(leaf);
  });

  it("states what it does not have: no record means no record id and no 'signed'", () => {
    const row = paidResult({ doorUrl: "https://councilof.ai/api/free-door", body: { totals: {} }, transaction: null });
    expect(row).toEqual({ kind: "paid", subject: "free-door", door: "https://councilof.ai/api/free-door", state: "DELIVERED" });
    expect(paidResult({ doorUrl: door, body: { card: { ...leaf, sig_ed25519: null } }, transaction: null }).state).toBe("DELIVERED · UNSIGNED");
  });

  it("does not keep a record too large for this browser's storage; the id still points at it", () => {
    const big = { ...leaf, payload: { blob: "x".repeat(PAID_RECORD_MAX_CHARS) } };
    const row = paidResult({ doorUrl: door, body: { card: big }, transaction: null });
    expect(row.record).toBeUndefined();
    expect(row.ref).toBe(leaf.sha256);
    expect(paidSubject("not a url")).toBe("not a url");
  });
});
