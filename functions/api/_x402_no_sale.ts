/**
 * THE NO-SALE ANSWER, DECLARED ONCE (2026-10-13).
 *
 * A wrapper door (functions/api/wrapper.ts, functions/api/wrapper/asset/[asset].ts) reads the chain
 * before it offers anything, so one URL has two honest unpaid answers: 402 with accepts[] when the
 * read came back, and a 200 that requests nothing when it did not. Only prose said so (the
 * description: "UNMEASURED answers 200 preview-only and is never sold"). /.well-known/x402.json
 * listed the door with accepts[] and nothing a program could read about the second answer, so a
 * checker comparing the listing with the live door took the 200 for a paid door that had stopped
 * challenging. The outward gate's consistency.x402_manifest_vs_live_402 did exactly that on
 * 13 Oct 2026: its four mismatches were the four fields it compares (network, amount, asset,
 * extra.name) of one door, /api/wrapper?id=usdc.e:arbitrum, answering 200 while public Arbitrum
 * RPC refused the read.
 *
 * This object is what both sides read. The doors build their no-sale 200 from it (noSale() below)
 * and the manifest publishes it as resources[].no_sale (OFFERS in functions/.well-known/x402.json.ts),
 * so "declined to sell, nothing requested" can be told from "listed and not challenging".
 * `body` is a subset: the live JSON body carries these fields with these values, among others.
 * functions/.well-known/x402-no-sale-parity.test.ts refuses the chain reads, calls every listed
 * door's own handler and fails on an unpaid answer that is neither the listed 402 nor this.
 *
 * NO IMPORTS, ON PURPOSE. The manifest module is also type-checked by the client project
 * (tsconfig.json, no Workers types). Importing the door from the manifest would pull
 * functions/api/wrapper.ts into that project and raise its error count past the committed
 * ceiling (scripts/ts-ratchet.mjs). The door re-exports these names, so nothing else moves.
 */
export const NOT_SOLD =
  "Nothing is sold while the state is UNMEASURED: this answer is 200, not 402, and no payment is requested. The free preview stays free; read it again later — public RPC endpoints recover on their own.";

export const NO_SALE_UNMEASURED = {
  status: 200,
  when: "nothing this request asks for could be read from the chain: the state is UNMEASURED",
  body: { preview_only: true, state: "UNMEASURED", payment: { requested: false, sent_to_facilitator: false, settled: false } },
  note: NOT_SOLD,
} as const;

/** The fields every no-sale 200 carries. `presented` is the one that varies: whether the request brought a payment header. */
export const noSale = (presented: boolean) => ({
  preview_only: NO_SALE_UNMEASURED.body.preview_only,
  state: NO_SALE_UNMEASURED.body.state,
  not_sold: NO_SALE_UNMEASURED.note,
  payment: { ...NO_SALE_UNMEASURED.body.payment, presented },
});
