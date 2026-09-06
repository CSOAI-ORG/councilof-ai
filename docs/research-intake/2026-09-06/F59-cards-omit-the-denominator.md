# F59 — the signed card omits the denominator

Found while reading a peer's methodology (F55): Vals AI publish accuracy **with error bars**; our
cards publish a bare float. Costing that turned up something sharper than a missing interval.

## The finding

**A signed measurement card carries `accuracy` and no sample size.**

```
body keys: accuracy, axis, created, issuer, kind, model, prev, public_framing, verify
accuracy : 0.0968
n / total / sample_size : ABSENT
```

**The live board carries it.** `GET /api/gspc` → each axis object includes **`n: 237`** alongside
`fleet_mean`, `mean_harm`, `cvar05_harm` and the rest.

So the **unsigned** surface is more informative than the **signed** one, on precisely the field that
decides whether the number means anything. `accuracy: 0.0968` could be 3 items or 3,000 and a card
reader cannot tell.

## Why this is worse than "no error bars"

An interval is a presentation choice. This is a **binding** problem.

The card commits, under `#card-attestation-1`, to `accuracy` — and **not** to the `n` that produced
it. The denominator can therefore change with no signature breaking and no id changing. Everything
the verifier proves stays true while the meaning of the number moves underneath it.

It also bounds what my own verification work established. `scripts/verify-estate.mjs` returns
**335/335** and that result is real, but it proves the bytes are authentic and unaltered. It cannot
prove the measurement is interpretable, because **the input needed to interpret it was never signed.**
`/.well-known/verify-yourself.json` already says *"signature validity is not measurement
correctness"*; this is the concrete instance of that sentence.

## What it is not

- **Not unrecoverable.** `n` exists on the board and is presumably joinable by `axis` + `model`. The
  information is in the estate; it is not in the signed bytes.
- **Not evidence of a wrong number.** No claim here that any accuracy figure is incorrect.
- **Not unique to us.** Of the peers probed, only Vals AI publishes intervals at all — but they are
  not making a recomputability claim, and we are.

## Costing the fix — and why it cannot simply be retrofitted

**Retrofitting is not available.** Every card `id` is `sha256(canonical(body))`. Adding `n` to the
body of an existing card changes its id, breaks its signature, and orphans its Merkle leaf. The
`root.json` `leaf_definition` binds the card set by exactly these hashes. **335 cards cannot be
amended; they can only be superseded.**

Three options, in increasing cost:

| # | Option | Cost | Honest? |
|---|---|---|---|
| 1 | **Say it on the card.** Add a `does_not_establish`-style line to *new* cards: *"this card carries no sample size; the denominator is published on /api/gspc and is not bound by this signature."* | schema change, new cards only | yes — states the gap without pretending to close it |
| 2 | **Bind `n` into new cards.** Add `n` (and optionally `ci_low`/`ci_high`) to the body going forward. Old cards stay as they are. | schema change + producer change; two card shapes in one chain | yes, and it closes the gap for everything issued after |
| 3 | **Supersede all 335.** Re-issue with `n` bound, new ids, new root. | large; invalidates every published card id and every citation of one | correct but expensive, and it breaks outward references |

**Option 1 is available immediately and costs almost nothing.** Option 2 is the real fix. Option 3
should not be done for this alone — the `HOW-TO-VERIFY.md` note about not being able to migrate
these cards without invalidating their ids applies here for the same reason.

**Recorded, not decided.** The card schema is not this lane's to change, and a two-shape chain is a
decision with consequences for every verifier including the reference one. This file states the
defect, the binding argument, and the three costings so whoever owns the schema decides with the
arithmetic in front of them.

```bash
# reproduce
curl -s -A ua https://councilof.ai/signed/cards/<id>.json | python3 -c \
  "import json,sys; print(sorted(json.load(sys.stdin)['body'].keys()))"      # no n
curl -s https://councilof.ai/api/gspc | python3 -c \
  "import json,sys; print(json.load(sys.stdin)['axes'][0]['n'])"             # 237
```
