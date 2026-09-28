# Correction C-2026-0924-01: public/corrections/living-stamp-unverifiable.json lists 7 slots as UNMEASURED; the live board carries 0 UNMEASURED axes

**Register id C-2026-0924-01. Promoted from draft D-2026-09-22T14-04.** Generated 2026-09-22T14:25:42Z by drift-draft.py on the pod. Promoted and published 2026-09-24 with the owner's approval.

Kind: `typed_claim_disagrees` - fingerprint `d1520d8783752683`

## The two byte-sources compared

- **A** (typed): `public/corrections/living-stamp-unverifiable.json @ cb773b2f9894#unmeasured_slots_unchanged`  
  sha256 `ea601d5ee48f80df32831d8ef3e18789f3bcae0299d14d2ead2edcbef5da9d49` - as_of `2026-08-28T17:19:43+01:00` (last commit touching the file)
- **B** (measured): `https://councilof.ai/api/gspc`  
  sha256 `6496ac94d3cadfff3671e47125bc1f29a8468c028372a7f8350a65856ad39f9e` - as_of `behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact axes 2026-08-25` (measured_on.date (prose, not compared as a timestamp))

The B digest is the SHA-256 recorded in the 2026-09-22 comparison. A fresh GET of this live endpoint reads current bytes and is not expected to match that historical digest.

## The field that moved

`unmeasured_slots_unchanged`

```
A: [
 "ai-economy-index",
 "custody-disclosure",
 "distribution-integrity",
 "human-labour-index",
 "humanoid-labour-index",
 "regulatory-framework",
 "reserve-attestation"
]
B: []
```

## Why it matters

A number typed on a static surface. The endpoint derives its count from the axis array (or the card index) at request time, so a typed copy goes stale the moment the measured surface moves. This loop records the disagreement; it does not establish why the copy was typed.

## Remedy published on 2026-09-24

The owner approved this dated supersession note. The 2026-08-28 JSON remains available as a historical reading; `/api/gspc` supplies the current board value. The corrections ledger and `SUPERSESSIONS.md` link the original file to this note.

## Check the historical source and current endpoint

```bash
git show cb773b2f9894:public/corrections/living-stamp-unverifiable.json | sha256sum   # historical A: ea601d5ee48f80df32831d8ef3e18789f3bcae0299d14d2ead2edcbef5da9d49
curl -fsS 'https://councilof.ai/api/gspc' | python3 -c 'import json,sys; print(json.load(sys.stdin)["totals"]["unmeasured_axes"])'   # current B field
```

Measurement, not a mark of conformity. UNMEASURED and UNCHECKABLE stay first-class; nothing here is a grade.

## Read on 2026-09-24

The live board lists 23 axes, 0 unmeasured. Five of the seven slot names above are axes marked MEASURED. `ai-economy-index` and `human-labour-index` are retired names kept as dataset slugs; the axes are now `ai-adoption-components` and `labour-components`, both MEASURED. The 2026-08-28 note is not edited.
