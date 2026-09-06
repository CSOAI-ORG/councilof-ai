# F71 — the artefact that declared its canonicalisation in prose is the one that broke

**Lane:** TUI-5 (research + capital) · **Date:** 2026-09-06 · **Status:** measured

## The claim

This estate signs over more than one canonicalisation. That is not itself a defect — the two
rules exist for real reasons and both are documented. The defect is **how each artefact says
which rule governs it**, and today gave a clean natural experiment, because two artefact
families made opposite choices and only one of them broke.

## What each family does

| Family | Declares its rule | How | Broke today? |
|---|---|---|---|
| The 335 signed measurement cards | **yes, in-band, per card** | a `preimage_rule` field whose value is the executable expression itself | no |
| The A2A agent card's signing input | **yes, but in prose** | `"spec": "A2A specification §8.4 — JWS over JCS(card minus signatures)"` | **yes** |

The card's declaration is not a description of the rule. It **is** the rule:

```
"preimage_rule": "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')"
```

A stranger who reads that string does not have to know this estate has two canonicalisations,
does not have to guess which one applies, and does not have to find a document. The bytes carry
their own instructions. That is why an independent Node reimplementation reproduced **335/335**
card ids and signatures from published bytes: there was nothing left to guess.

The agent card's signing input said "JCS" in a `spec` string. JCS (RFC 8785) mandates raw UTF-8
with minimal escaping. The bytes committed under that declaration were **ASCII-escaped** —
`§`, `·`, `—` — which is the *other* rule's escaping. The file asserted its
conformance and nothing compared the assertion with the bytes.

## Why it survived so long

The two encodings **parse to the same JSON**. Byte-for-byte the alias pair differed (7432 vs
7383 bytes; 0 non-ASCII + 15 escapes against 41 non-ASCII + 0 escapes), but every tool that
loaded them as JSON and compared objects saw two identical documents. A defect that is invisible
to `==` on parsed values and visible only to `==` on bytes will outlive any amount of review by
people reading JSON.

This is the same shape as the earlier miss this session, from the other direction: the
`HOW-TO-VERIFY` page published a JavaScript snippet that emitted `"0"` where the cards' rule
emits `"0.0"`. It failed **85 of 335** cards. Same root cause — code written against one
canonicalisation, applied to artefacts governed by the other — and again the giveaway was only
in the bytes.

## The finding

> Declaring the rule is necessary and **not** sufficient. Both families declared. The one that
> declared **executably** held; the one that declared **in prose** drifted, because prose cannot
> be diffed against the artefact it describes.

Note what this is *not*: it is not an argument for one canonicalisation. Collapsing to a single
rule is a much larger change, it would invalidate signatures over the existing 335, and it is
not this lane's call. An artefact that says exactly how its own bytes were made is
interoperable whether or not the estate ever converges.

## What would have caught it

A `preimage_rule`-style field on the JWS input — machine-readable, naming the escaping — plus
one assertion that recomputes the preimage from the declared rule and compares. The producer
already emits correct JCS (`scripts/adapters/agent_card_jws.py:57`, `ensure_ascii=False`); the
gap was that nothing re-ran it and nothing checked the committed output against its own claim.

The existing test suite *did* eventually catch this, which is worth saying plainly. What it
could not do was say **why**: it reported a digest mismatch and a base64 mismatch, which reads
like a corrupted or malicious artefact rather than a stale producer run. Two minutes of the
diagnosis went into establishing that the served card was fine.

## Cost of the remedy

Small, and not this lane's file area to apply. One field added by the producer, one assertion
next to the tests that already exist. Filed rather than implemented.

## Provenance

- Card `preimage_rule` and `alg`: read from one published card,
  `/signed/cards/82994353b8f9…9a1c.json`. **One card sampled, not all 335** — the ≤20 probes/hour
  budget was spent by the time this was written. The claim "each card declares it" is therefore
  *supported for the sampled card and by the field being part of the card schema*, and is not a
  measurement of all 335. Whoever picks this up should confirm across the set.
- 335/335 id + signature reproduction: `scripts/verify-estate.mjs`, this session.
- Byte counts, escape counts and the parse-equality of the alias pair: measured directly on the
  two files at `origin/master` before the fix landed.
- 85/335 snippet failure: measured this session against the published `HOW-TO-VERIFY` snippet.
