# ROOT-POLICY RULING — the public root is a deduplicated current-state set, not an append-only log

**Ruled:** 2026-10-29 · **Evidence gathered:** 2026-10-28/29 from the estate's own builder, its own root history, and
the live root. **Status:** this is a ruling about what the published structure *is* and how it must be described. It
changes no code and moves no number.

---

## The ruling

**The public root stays a deduplicated current-state set with sticky card membership. It is not an append-only log, and
the public copy must stop implying that it is. The append-only property belongs to the signed card index and the
corrections ledger, which are separate corpora — the root is the *snapshot* those corpora are summarised into.**

The implementation already behaves this way. The gap was never in the code; it was in how the structure is described.

---

## Why, in five pieces of evidence

**1. The builder says so in its own words.** The root builder states that *"the root is a coverage SNAPSHOT, not an
append-only log"*. The leaf-union builder that assembles it uses **RFC 6962 domain separation** over the leaves it
selects — a Merkle tree over the current membership set, not a chain of history.

**2. The root's own history loses members.** Across the 69-entry root history, `card_count` moves in both directions:
`-2`, `-1`, `-3`, `-4`, `-6`. **An append-only structure cannot lose members.** A set can.

**3. Master and live disagree on membership at equal size.** The root in the repository and the root served at
`https://councilof.ai/root.json` carry the **same count (325)** but **67 different leaves**. That is a recomputed
membership set, not an appended history: if it were append-only, the live root would be a superset of the repository
root, not a different set of the same size.

**4. Sticky cards are the mechanism that stops measurement loss.** The builder's retention logic keeps a card's
membership sticky so that a measurement already published is not silently dropped when the current set is recomputed.
That is the correct trade for a *snapshot*: coverage without false accumulation.

**5. The append-only surfaces exist, and they are elsewhere.** The corrections ledger carries **58 withdrawn** and
**1,682 superseded** entries — both confirmed against live sources. Those are the append-only record. The root
summarises; the ledger remembers.

---

## What this ruling does and does not do

| | |
|---|---|
| **Does** | record the decision, so the public description of the root matches what the root does |
| **Does** | keep the existing implementation — no code change is required, and none was made |
| **Does not** | convert the root into an append-only log |
| **Does not** | change any count, merkle root, signature or leaf |
| **Does not** | move any axis to MEASURED, and confers no status on anything |

## What this ruling obliges

1. **The public copy stops implying append-only.** Where the root is described as an append-only ledger or an
   ever-growing log, that wording is wrong and must be corrected. A snapshot that drops members is not a log.
2. **The two corpora stay named separately.** The public root (324 catalogued leaves) and the signed card index
   (335 declared, 335 rows — internally consistent, but a different number again) have **no id in common**. Neither is
   a subset of the other by construction, and neither may be presented as the other.
3. **The card index's 335 and the root's 324 are not a defect to be reconciled by fiat.** They are two different
   corpora with two different membership rules. The live verifier already reports this distinction rather than
   reconciling it.

## The gap this ruling does not close

`/state-of-claim-maintenance/` returns **404** while the live register claims **92.86%** coverage against
`due_unrun_next_read: 26`. That is a separate open defect — a published claim about a page that is not served — and it
is not affected by this ruling. It stays on the docket.

**Measurement, never a certification.** This ruling describes the shape of a published structure. It decides nothing
about whether any measured claim is true, and it grants no status to any subject.
