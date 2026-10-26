# Root-log decision: append-only Merkle log (2026-10-25)

**Decision.** The ONE public root keeps the append-only Merkle log. The deduplicated
current-state set is not adopted as the root.

**Status.** Resolved on the evidence below. The root candidate that motivated the open
question is not published as-is.

**Where the question came from.** `public/completion.json` listed an open blocker: the
root candidate drops 94 master leaves, including asset-measurement cards, and the two
options were "append-only Merkle log" versus "deduplicated current-state set".

## The evidence that decides it

The estate already runs a guard against exactly this question, and its arithmetic is
deterministic. `fleet/ops-guard/prod-canary.py` treats the root as a rolling head and
rejects a material drop:

```python
MAX_ROOT_DROP_PCT = float(os.environ.get("MAX_ROOT_DROP_PCT", "5"))
MAX_ROOT_AGE_H   = float(os.environ.get("MAX_ROOT_AGE_H", "36"))
min_count = max(1, math.ceil(high_water * (1.0 - MAX_ROOT_DROP_PCT / 100.0)))
```

With the live root at **317 leaves**, `min_count` is `ceil(317 * 0.95)` = **302**.

The deduplicated candidate holds `317 - 94` = **223** leaves. `223 < 302`, so the
deduplicated set fails the estate's own canary on every run, permanently. Publishing it
means either lowering `MAX_ROOT_DROP_PCT` below 29.7%, or accepting a standing
`REGRESSION` on the public root.

The append-only log holds a leaf count that only grows, so it passes the same gate with no
change to the guard at all.

That asymmetry is the decision: **option A needs zero guard changes, option B needs a
guard weakened.** The standing constraint on this estate is that no guard is weakened to
make a status read green, so option B is not available without breaking a rule to satisfy
a rule.

The freshness axis points the same way. `MAX_ROOT_AGE_H` is 36 hours. The live root's
`as_of` is 2026-10-13T03:31:42Z, about 288 hours behind at the time of writing, so the
canary is already failing on age. Republishing an append-only root clears that axis too;
the deduplicated root would clear age while still failing count.

## The auditability argument, stated separately

The canary argument is about monitoring. This one is about what a third party can prove.

Every card ever issued carries an inclusion path against the root that was current when
it was issued. The 94 leaves the candidate drops include asset-measurement cards, which
means it removes leaves that somebody may already hold an inclusion proof for. A
deduplicated current-state set is a different object from the log that produced those
proofs: it answers "what is true now" and stops answering "what was true, and when".

Both questions deserve an answer. The estate's doctrine already separates them, and the
separation is not optional:

- the **signed index** stays append-only, because it is the object that carries proofs;
- a **current-state view** may be published alongside it, because it is a different
  question and needs no new root.

So the durable answer is not "one or the other". It is: the ONE root remains the
append-only log, and any current-state convenience view is published beside it as a
derived read that never becomes a second root. A second root splits trust across exactly
the thing that is meant to be one verification path.

## What changes operationally

1. The root candidate is not published in its deduplicated form.
2. The publish path must keep, for every master leaf, the ability to be included in the
   log; leaves are retired by superseding them, not by dropping them.
3. `MAX_ROOT_DROP_PCT` and `MAX_ROOT_AGE_H` stay where they are. They are the guard, and
   they were right to fire.

## What is still not decided here, and who owns it

- **Disk headroom.** Separate blocker, separate cause. The M4 storage guard refuses
  generation below 10 GB free; the volume is shared with everything else on the host, and
  the bulk of it is not CSOAI's to reclaim. Recovering it is an operator decision about
  what else lives on the host. This document does not touch it.
- **Republishing the root.** The root is republished by the existing pipeline once the
  candidate is correct under the append-only rule. Nothing here changes the pipeline; it
  changes which candidate is eligible.

## Verification

- `min_count` arithmetic: `ceil(317 * 0.95)` = 302 against a candidate of 223. Reproducible
  from `fleet/ops-guard/prod-canary.py` and the live `root.json` `card_count`.
- Canary read of `https://councilof.ai/root.json` is a public read; it needs no token.

Measurement, not certification. This document records a decision and its evidence. It is
not an approval of the candidate, and it does not mark any root, card or implementation as
conformant.
