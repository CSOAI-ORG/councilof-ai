# Commissioned measurement: engagement scope (DRAFT, HELD for the owner's terms)

**Status: HELD.** This is not an offer and is not published. It becomes usable only after the owner
has ruled on the open terms marked **[OWNER]** below, including self-commissioning. Record schema:
`measurement/commissioned/commission-kinds-v0.1.schema.json`. Disclosure guard:
`measurement/commissioned/commissionGuard.mjs`, tested in `commissionGuard.test.mjs`.

## What you can commission

You can commission one piece of measurement work about one named subject. It is one of four kinds:

| Kind | What is delivered | States it can return |
|---|---|---|
| Maintained claim | A subject's public claim, captured verbatim, hashed and re-read on a declared cadence for a declared term, under the claim-maintenance spec. | CLAIM_CAPTURED, MEASURED where a method exists, UNMEASURED, UNCHECKABLE |
| Reproduction on request | One published result re-run from its own inputs, with every read hashed. | REPRODUCED, NOT_REPRODUCED, UNMEASURED |
| Underwriter evidence pack | The already-signed cards about one subject, assembled with Merkle inclusion proofs for a named reader. | DELIVERED_AS_FOUND, UNMEASURED |
| Disclosure timeline | The dated sequence of a subject's public statements and changes on one topic, each source hashed. | INDEXED, UNMEASURED |

## How it is paid

- **Per delivered work.** You pay for each piece of work handed over. There is no subscription, no
  tier and no retainer.
- **Two ways to pay.** Through the existing x402 door (`commission_card` / `/api/request-attestation`),
  or by a GBP invoice from CSOAI LTD.
- **No public price.** The amount appears only in the x402 challenge or on the invoice. It never
  appears on a page, in this scope or on the record.
- **Never contingent on content (spec §10.2).** What you pay does not depend on what is found. You
  cannot pay for a sooner reading, a different reading, or a removal.
- **[OWNER]** Payment timing: in advance, or on delivery. Refund terms when the work comes back
  UNMEASURED because a source was unreachable.

## What a commission never buys

- **Never a grade, score, rank or certificate.** It is a measurement record, stated in its own states.
- **Never a result agreed in advance.** The outcome is recorded as found, including NOT_REPRODUCED
  and UNMEASURED.
- **Never an allegation (spec §10.1).** The record states the claim, the measured value, the window,
  the denominator and the method, and stops. It never says a claim is false or misleading.
- **Never exclusivity over the facts.** Verification is free: anyone can check a delivered record
  against the public key and the public root without paying.

## Disclosure (spec §10.3)

Every commissioned artifact names who paid for it, on the artifact itself: "Commissioned and paid
for by <legal entity>". It also names any relationship between the payer and the subject, and between
CSOAI and either of them. A payer that cannot be named cannot commission.

## Open decisions for the owner

1. **Self-commissioning.** May a subject commission a record about itself? Until you rule, the guard
   refuses `relationship_to_subject: IS_SUBJECT`.
2. The §10 disclosure wording to use on the artifact (draft above).
3. Payment timing and refund terms (above).
4. Whether a maintained claim's term and cadence are fixed options or set per engagement.
5. Who signs the scope letter for CSOAI LTD.

*Measurement, not certification. Draft of 2026-09-28, lane x402-revenue-20260928.*
