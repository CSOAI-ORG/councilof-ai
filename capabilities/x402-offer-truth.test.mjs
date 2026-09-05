/**
 * x402-offer-truth.test.mjs — what a buyer is told, at the moment they are asked to pay.
 *
 * WP-6 asks for clear paid deliverables. The x402 challenge from GET /api/request-attestation is
 * where that actually happens: it is the only place a paying party — usually an agent, not a
 * person — learns what the money buys, before any money moves.
 *
 * Probed 2026-09-05 and it is sound, which is worth recording:
 *
 *   x402Version 2, and the 402 carries a full `accepts[]`: scheme "exact", network
 *   eip155:8453 (Base), 20000 units of USDC at 6 decimals, a payTo address and a
 *   300-second timeout. A Bazaar extension declares the input query params and an example
 *   output against schema card-v0.
 *
 * THE PART THAT MATTERS MOST is the description, because it is a sales surface and sales
 * surfaces are where estates overclaim:
 *
 *   "re-serves existing signed measurement cards, never invents a score.
 *    Measurement, not certification. … TIE is TIE · not a certificate."
 *
 * It sells a re-service of existing evidence and says so. It does not promise a NEW
 * measurement, a grade, or a certificate — the three things this estate refuses to sell.
 *
 * AND THE FIGURES ARE DERIVED, NOT WRITTEN. The board counts in that description are
 * `totals.lid` from GET /api/gspc, embedded verbatim. Confirmed by comparing the two live
 * responses. So the payment challenge cannot drift from the measurement it is selling: change
 * the board and the offer's own words change with it. That is the correct construction and it
 * is the thing most likely to be "simplified" into a hardcoded string by someone tidying up.
 *
 * Offline by default. LIVE_X402=1 fetches the challenge and the board and compares them.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const OFFER = "https://councilof.ai/api/request-attestation";
const BOARD = "https://councilof.ai/api/gspc";

describe("the x402 offer tells the buyer the truth", () => {
  it("live: the paid door answers with a real 402 challenge", async () => {
    if (!process.env.LIVE_X402) {
      console.log("      (offline: LIVE_X402 unset — challenge NOT fetched)");
      return;
    }
    const res = await fetch(OFFER);
    assert.equal(res.status, 402, `expected the x402 challenge, got HTTP ${res.status}`);
    const d = await res.json();
    assert.ok(d.x402Version >= 1, "no x402Version — this is not an x402 challenge");
    const a = (d.accepts ?? [])[0];
    assert.ok(a, "accepts[] is empty. A 402 with nothing to accept cannot be paid, so the " +
      "rail is advertised and unusable.");
    for (const f of ["scheme", "network", "payTo", "maxAmountRequired"]) {
      assert.ok(a[f], `accepts[0] is missing ${f} — a wallet cannot sign against it`);
    }
  });

  it("live: the offer sells a re-service of evidence, not a grade or a certificate", async () => {
    if (!process.env.LIVE_X402) {
      console.log("      (offline: LIVE_X402 unset — description NOT read)");
      return;
    }
    const d = await (await fetch(OFFER)).json();
    const desc = String(d.resource?.description ?? "");
    assert.ok(desc.length > 80, "the paid resource has no meaningful description");
    assert.match(
      desc,
      /never invents a score/i,
      "the offer no longer states that it re-serves existing cards rather than inventing a " +
        "score. That sentence is the difference between selling evidence and selling a grade.",
    );
    assert.match(
      desc,
      /not a certificate/i,
      '"not a certificate" has left the paid offer. This estate measures and never certifies, ' +
        "and the one place that must be unambiguous is where someone is being asked to pay.",
    );
    assert.ok(
      !/\bcertified\b|\bguarantee/i.test(desc),
      `the paid offer now uses certification language: ${desc.slice(0, 160)}`,
    );
  });

  it("live: the board figures in the offer are DERIVED from the board, not written down", async () => {
    if (!process.env.LIVE_X402) {
      console.log("      (offline: LIVE_X402 unset — derivation NOT checked)");
      return;
    }
    const [offer, board] = await Promise.all([
      (await fetch(OFFER)).json(),
      (await fetch(BOARD)).json(),
    ]);
    const lid = String(board.totals?.lid ?? "").trim();
    assert.ok(lid.length > 20, "the board no longer publishes totals.lid to derive from");
    assert.ok(
      String(offer.resource?.description ?? "").includes(lid),
      `the offer's board counts are no longer the board's own totals.lid. If they were ` +
        `hardcoded for tidiness, the payment challenge can now drift from the measurement it ` +
        `sells — a buyer would be quoted figures the board has moved past. Expected to find:\n` +
        `  ${lid}`,
    );
  });
});
