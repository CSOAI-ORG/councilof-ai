# The EMILIA vector boundary is mechanically enforced — verified 6 September 2026

The lane doc calls `packages/gspc-card-verifier/test/vectors` *"a frozen reciprocal boundary with
EMILIA — never change a vector without a new pin and a note to Iman."*

That is a **convention**. This checks whether it is also a **mechanism**, because today produced
nine cases where something assumed healthy was not, including a published verification snippet that
failed 85 of 335 cards because nobody had ever run it.

## It is a mechanism. Proven by breaking it.

```
package test suite, untouched          134 pass / 0 fail
tamper one field of one vector         not ok 1 - corpus is pinned: every vector
  (c001-unicode-in-name.json, `why`)   matches its manifest digest      35 pass / 1 fail
restore                                36 pass / 0 fail
```

`test/evaluation-result.test.mjs` reads `manifest.json`, asserts `files.length === manifest.total`,
and checks **every vector against its recorded sha256**. Editing any byte of any vector turns the
suite red. The boundary cannot be moved silently, which is the property the convention was asking
for.

**Corpus state:** 33 vectors — 9 VALID, 17 INVALID, 7 UNCHECKABLE — under
`predicateType: https://councilof.ai/attestations/evaluation-result/v1`, public key
`ea4a6c63e29c520abef5507b132ec5f9954776aebebe7b92421eea691446d22c`, generated deterministically
(`test/make-eval-vectors.mjs`, fixed seed, fixed timestamp).

## Why record a result with no defect in it

Because "we checked and it holds" is a finding, and the alternative is that nobody knows. Four
things today looked fine and were not: a published JS snippet that failed 85 of 335 cards, a moat
claim that had never been tested, a CI gate that breached a rate limit by 17×, and an IP register
asserting an anchoring rail that has issued nothing. **The cheap check is the one that distinguishes
the two cases, and it is only cheap before you need it.**

## What this does not establish

- **Nothing about the GSPC measurement cards.** This corpus is `evaluation-result` DSSE envelopes
  under key `ea4a6c63…`; the 335 cards are a different artefact under `d4cb0eaa…`
  (`#card-attestation-1`). They do not share a canonicalisation — see the Rule A / Rule B scope now
  recorded in `HOW-TO-VERIFY.md`.
- **Nothing about whether the vectors are the right vectors.** The pin proves they have not changed,
  not that they cover what they should.
- The tamper test was run locally and reverted; `git status` on `packages/` is clean.

```bash
cd packages/gspc-card-verifier && node --test test/*.test.mjs      # 134 pass / 0 fail
```
