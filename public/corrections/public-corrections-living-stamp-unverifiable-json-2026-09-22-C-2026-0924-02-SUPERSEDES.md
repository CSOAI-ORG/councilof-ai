# Correction C-2026-0924-02: public/corrections/living-stamp-unverifiable.json: attestations_that_do_verify (measurement cards) 150 -> 335

**Register id C-2026-0924-02. Promoted from draft D-2026-09-22T14-05.** Generated 2026-09-22T14:25:42Z by drift-draft.py on the pod. Promoted and published 2026-09-24 with the owner's approval.

Kind: `typed_claim_disagrees` - fingerprint `025f75a98669c0d4`

## The two byte-sources compared

- **A** (typed): `public/corrections/living-stamp-unverifiable.json @ cb773b2f9894#attestations_that_do_verify`  
  sha256 `ea601d5ee48f80df32831d8ef3e18789f3bcae0299d14d2ead2edcbef5da9d49` - as_of `2026-08-28T17:19:43+01:00` (last commit touching the file)
- **B** (measured): `https://councilof.ai/api/state`  
  sha256 `efc1ffbbba84b4d20bf1e4e16c249fdbf901063563e07775841c8b33d224e300` - as_of `2026-09-22T14:25:28Z` (fetched_at (payload carries no as_of))

## The field that moved

`attestations_that_do_verify (measurement cards)`

```
A: 150
B: 335
```

## Why it matters

A number typed on a static surface. The endpoint derives its count from the axis array (or the card index) at request time, so a typed copy goes stale the moment the measured surface moves. This loop records the disagreement; it does not establish why the copy was typed.

## Proposed remedy (owner decides)

PROPOSED, nothing has changed yet: supersede the stale surface with one that derives the value from the measured surface (or a dated note beside it naming the value at 2026-09-22T14:25:27Z); never edit signed or dated bytes in place. The owner decides the remedy on promotion; this draft records the disagreement only.

## Reproduce

```bash
git show cb773b2f9894:public/corrections/living-stamp-unverifiable.json | sha256sum   # expect ea601d5ee48f80df32831d8ef3e18789f3bcae0299d14d2ead2edcbef5da9d49
curl -sS 'https://councilof.ai/api/state' | sha256sum   # expect efc1ffbbba84b4d20bf1e4e16c249fdbf901063563e07775841c8b33d224e300
```

Measurement, not a mark of conformity. UNMEASURED and UNCHECKABLE stay first-class; nothing here is a grade.

## Read on 2026-09-24

`/api/state` card_chain.bodies_verified_valid reads 335 (kind measured): the signed card index holds 335 cards and all 335 verify. That is corpus 3 of the three separate card counts described in council-os/CARD-CORPORA.md; it is not added to, reconciled with or substituted for the other two. The 2026-08-28 note is not edited; its 150 was true when written.
