---
name: verify-card
description: Verify a Council of AI signed measurement card. Three-state verdict only — VALID, INVALID with a reason, or UNCHECKABLE. Use when the user pastes a card JSON, a card id, or a councilof.ai card URL, or asks whether a measurement card is genuine.
---

# Verify a measurement card

A card is a `gspc.measurement-card`. Verification recomputes the card id from the canonical body and
checks the Ed25519 signature under a **published pinned key** in the DID document
`did:web:csoai.org`.

## The rule

1. Recompute the card id from the canonical body bytes.
2. Check the Ed25519 signature under a key that is **pinned in the verifier** and published in the DID
   document: `#card-attestation-1`, `#card-attestation-2`, plus the board key.
3. A card that is internally consistent but signed with a freshly generated key is **INVALID**, not
   valid. Anyone can alter a body and sign it with a key they just made.
4. A card naming an inline key outside the pinned set is **INVALID**. A card naming a DID key
   reference outside the pinned set is **UNCHECKABLE**.

Three verdicts, never two: `VALID`, `INVALID` (with the reason), `UNCHECKABLE`. "Could not check" is a
different claim from "forged".

## How

Prefer MCP `verify_card` with `{ "card": <object | JSON string | https://councilof.ai/... URL | 64-hex id> }`.

Human UI: https://councilof.ai/verify — the browser recomputes locally; nothing needs to be sent to
Council of AI.

## Output

```
verdict: VALID | INVALID | UNCHECKABLE
reason:  <one line>
id:      <recomputed or stated>
key:     did:web:csoai.org#card-attestation-1
```

Verdict first. Only if VALID, quote the measured axes and the empty slots exactly as the card states
them.

UNCHECKABLE when the payload is truncated, the schema is unknown, or a URL was given whose origin is
not councilof.ai / csoai.org.

## Forbidden

- Summarising the score before the verdict
- Turning UNCHECKABLE into FAIL, or INVALID into "probably fine"
- Verifying a card the user has not given you
