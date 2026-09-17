# The public root is not a log

**A correction against ourselves, 17 September 2026.** Measured from our own published bytes.

## The claim

`public/root.json` is a **point-in-time snapshot**, re-derived on each publish. It is not an
append-only log, not a growing catalogue, and not even a set that only gains members. Successive
published roots carry **no consistency relation**, and an inclusion proof is valid only against the
one root it names.

Nothing on the published surface says any of this today. That silence is the defect this document
exists to close.

## How this was found

It was not the thing being looked for. A spike on witness cosigning
(`docs/spikes/witness-cosigning-spike-2026-09-17.md`) needed to answer a prerequisite: a witness
signs *"tree N+1 is consistent with tree N"*, so is our root append-only?

The first written answer was that the leaves were sorted by digest — carried over from a different
file's merkle code and **never checked against the published bytes**. The proving command written
for that very section contradicted it within a minute. The leaves are not sorted. What the bytes
show instead is worse than the thing that was wrong.

## The measurement

Every revision of `public/root.json` in git history: **28 revisions, 2026-09-07T12:30:34Z →
2026-09-15T07:13:43Z.** These are the published bytes of each revision, not a reconstruction.

| measure | value |
|---|---|
| append-only transitions | **0 of 27** |
| transitions that LOSE leaves | **27 of 27** |
| declared `card_count` decreases | **8** |
| distinct leaves across the window | **2,557** |
| leaves present in **every** revision | **0** |
| leaves appearing in exactly **one** revision | **2,022 (79%)** |
| leaves that left and later returned | 16 |
| most leaves ever carried across one publish | 230 |
| fewest leaves dropped in any publish | 43 |

Declared `card_count`, in publication order:

> 168, 167, 169, 167, 168, 197, 197, 228, 257, 257, 264, 269, 294, 291, 297, 298, 299, 299, 304, 300, 305, 304, 305, 303, 303, 312, 311, 305

**A log cannot shrink.** This one shrinks eight times. That single line needs no leaf identity at
all — it can be read straight off the published counts by anyone.

### Every transition, in full

| published | card_count | carried over | dropped | added |
|---|---|---|---|---|
| 09-11 08:45 | 168 → 167 | 107 | 61 | 60 |
| 09-11 12:45 | 167 → 169 | 108 | 59 | 61 |
| 09-12 08:47 | 169 → 167 | 124 | 45 | 43 |
| 09-12 09:48 | 167 → 168 | 124 | 43 | 44 |
| 09-12 10:20 | 168 → 197 | 125 | 43 | 72 |
| 09-12 10:40 | 197 → 197 | 154 | 43 | 43 |
| 09-12 13:27 | 197 → 228 | 154 | 43 | 74 |
| 09-12 19:21 | 228 → 257 | 175 | 53 | 82 |
| 09-13 03:01 | 257 → 257 | 169 | 88 | 88 |
| 09-13 06:03 | 257 → 264 | 170 | 87 | 94 |
| 09-13 08:40 | 264 → 269 | 191 | 73 | 78 |
| 09-13 16:15 | 269 → 294 | 177 | 92 | 117 |
| 09-13 19:27 | 294 → 291 | 200 | 94 | 91 |
| 09-14 01:03 | 291 → 297 | 216 | 75 | 81 |
| 09-14 03:12 | 297 → 298 | 216 | 81 | 82 |
| 09-14 09:45 | 298 → 299 | 177 | 121 | 122 |
| 09-14 10:56 | 299 → 299 | 221 | 78 | 78 |
| 09-14 12:34 | 299 → 304 | 199 | 100 | 105 |
| 09-14 15:16 | 304 → 300 | 223 | 81 | 77 |
| 09-14 16:58 | 300 → 305 | 223 | 77 | 82 |
| 09-14 18:17 | 305 → 304 | 207 | 98 | 97 |
| 09-14 19:23 | 304 → 305 | 207 | 97 | 98 |
| 09-14 22:21 | 305 → 303 | 223 | 82 | 80 |
| 09-15 00:27 | 303 → 303 | 223 | 80 | 80 |
| 09-15 01:31 | 303 → 312 | 206 | 97 | 106 |
| 09-15 05:30 | 312 → 311 | 0 | 312 | 311 |
| 09-15 07:13 | 311 → 305 | 230 | 81 | 75 |

The transition at **2026-09-15T05:30Z** is the clearest case: 312 leaves in, 311 leaves out,
**zero in common**. The entire anchored set was replaced in one publish.

## Why it matters, today, to a reader

This is not a future risk awaiting a witness protocol.

An inclusion proof is cut against one root, and the set is re-derived at the next one. Two different
rates matter here and they must not be run together:

- **Across a single publish**, a leaf survives about **73%** of the time (median over 27
  transitions; range 0–78%). So roughly **one leaf in four is dropped at each publish**, and the
  smallest loss in any publish is 43 leaves. One transition — 2026-09-15T05:30Z — dropped **all**
  of them.
- **Across the whole window**, **79%** of every leaf ever published appears in exactly one revision.
  That is the cumulative effect of repeated churn over 28 publishes, **not** the single-step rate.

An earlier draft of this document stated the single-step risk as "roughly two-in-three". That was
wrong: it applied the window-wide 79% figure to a single transition. The per-publish number is
about one in four. The finding is unchanged and the direction is unchanged; the magnitude of the
single-step claim was overstated and is corrected here rather than quietly adjusted.

The proof still verifies against the root it names — the mathematics is sound and nothing here says
otherwise. But the leaf may no longer be in the currently published set, and nothing on the surface
tells the reader which state is current, or that the two can differ at all.

Put plainly, for a reader outside this estate: **a proof handed to a third party may name a leaf
that the next published root does not contain — not because anything was deleted, but because the
set is re-derived on every publish.**

For witnessing specifically, the consequence is terminal rather than awkward: a witness cosigns
consistency between successive trees, and here there is no consistency relation to sign. Witness
cosigning is not merely unimplemented — it is **not yet meaningful**.

## What this does NOT show

Stated as plainly as the finding, because a correction that overreaches is just a different error.

- **It does not say any card is wrong.** No card body was read for this. Nothing here is a claim
  about any measurement.
- **It does not say a signature fails.** Every root in the window is signed, and this document ran
  no verification that would contradict that.
- **It does not say an inclusion proof is invalid.** A proof against the root it names still
  verifies. The gap is between roots, not inside one.
- **It does not allege deletion.** The shape is exactly what a producer that re-harvests its inputs
  each run would leave behind. No intent is claimed, and none is needed for the harm to be real.
- **It does not measure the signed-card corpus.** That is a SEPARATE corpus (identifier overlap 0)
  and is untouched by this. Never add the two.
- **It does not establish what the set SHOULD contain.** Only that what it does contain is not
  stable across publishes.

## Independently replicated

Two implementations, written separately, agree. A second walk over a 14-revision window reported
0 of 13 append-only transitions, 1,674 distinct leaves, 0 present in every revision, and 1,160
appearing once. Re-running this script at `n=14` reproduces those four numbers exactly.

That second walk's **first** attempt is worth recording too: it looked for leaves under
`leaves` / `cards` / `entries`, found none in any revision, and reported *13 of 13 append-only* —
comparing empty sets to empty sets. A check that finds nothing and calls it success. The real field
is `card_sha256`. Both of today's readings of this file began with an error, and both were caught by
running a command rather than by reasoning harder.

Window sizes differ between readings because the window is a parameter. Every number in this
document is for the **28-revision full window**; the 12- and 14-revision figures quoted elsewhere
are the same measurement over shorter windows, and reproduce exactly when the window is matched.

## The smallest honest step

It needs no signer, no deploy, and no change to any signed byte. Say on the published surface what
is already true:

1. this is a point-in-time snapshot, not an append-only transparency log;
2. successive roots carry no consistency relation, and no consistency proof between them exists;
3. an inclusion proof is valid only against the root it names.

Making the producer append is the real repair, and it is a larger change requiring a freshly signed
root — which requires the board signer, which runs inside GitHub Actions, which is disabled
account-wide. The disclosure does not have to wait for any of that.

## Proving command

```bash
python3 scripts/audit_root_leaf_churn.py 28 /tmp/churn.json
```

Reads every revision of `public/root.json` out of git and prints the declared-count series, the
append-only transition count, the distinct-leaf union and the persistence distribution. The machine
artifact is `docs/reconciliation/public-root-churn-2026-09-17.json`, where every integer carries the
revision it was read from.

Source of truth is **local git history**, not a live endpoint — successive published roots exist
nowhere else; the live endpoint serves one snapshot. That is the one count in this set that cannot
come from a URL, and it is labelled rather than dressed up as one.
